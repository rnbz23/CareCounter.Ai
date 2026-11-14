import { GoogleGenAI, type Part } from "@google/genai";
import { z } from "zod";

import {
  BillExtractionSchema,
  LineItemSchema,
  type BillExtraction,
} from "@/types/contracts";
import {
  assertBillSize,
  assertPdfPageLimit,
  assertSupportedMimeType,
  type SupportedFileMimeType,
} from "@/lib/billing/input";

const GeminiLineItemSchema = LineItemSchema.omit({ id: true });
const GeminiBillExtractionSchema = BillExtractionSchema.omit({ lineItems: true }).extend({
  lineItems: z.array(GeminiLineItemSchema),
});

const { $schema: _schemaDeclaration, ...GEMINI_RESPONSE_JSON_SCHEMA } = z.toJSONSchema(GeminiBillExtractionSchema, {
  target: "draft-7",
});

const EXTRACTION_PROMPT = `You are an extraction engine for a hospital billing statement.
Return only JSON matching the supplied response schema. Do not offer advice.
Extract only printed, visible facts. Set code to null if no billing code is printed.
Use USD integer cents (for example, $123.45 becomes 12345). Each line's billedCents is that line's total, not a unit cost.
Preserve a service date only when visible. If a word or number is unclear, use low extractionConfidence and add a note.
Do not hallucinate hospital names, insurers, CPT or HCPCS codes, coverage, or amounts.
Do not return patient names, addresses, birth dates, member IDs, account numbers, or any other identifying information.
Do not create line-item IDs; the server assigns those after validation.`;

type GenerateContentParams = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

export type GeminiGenerateContent = (
  params: GenerateContentParams,
) => Promise<{ text?: string }>;

export type ExtractBillInput =
  | { inputType: "text"; text: string }
  | {
      inputType: "pdf" | "image";
      bytes: Uint8Array;
      mimeType: SupportedFileMimeType;
    };

export interface ExtractBillOptions {
  apiKey?: string;
  model?: string;
  generateContent?: GeminiGenerateContent;
}

export class GeminiConfigurationError extends Error {
  constructor() {
    super("GEMINI_API_KEY is not configured.");
    this.name = "GeminiConfigurationError";
  }
}

export class BillExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillExtractionError";
  }
}

async function validateInput(input: ExtractBillInput): Promise<void> {
  if (input.inputType === "text") {
    const bytes = Buffer.byteLength(input.text, "utf8");
    assertBillSize(bytes);
    return;
  }

  assertSupportedMimeType(input.mimeType);
  assertBillSize(input.bytes.byteLength);

  if (input.inputType === "pdf" && input.mimeType !== "application/pdf") {
    throw new BillExtractionError("PDF input must use the application/pdf MIME type.");
  }

  if (input.inputType === "pdf") {
    await assertPdfPageLimit(input.bytes);
  }

  if (input.inputType === "image" && input.mimeType === "application/pdf") {
    throw new BillExtractionError("Image input cannot use the application/pdf MIME type.");
  }
}

function sourceParts(input: ExtractBillInput): Part[] {
  if (input.inputType === "text") {
    return [{ text: `${EXTRACTION_PROMPT}\n\nBILL TEXT\n${input.text}` }];
  }

  return [
    { text: EXTRACTION_PROMPT },
    {
      inlineData: {
        data: Buffer.from(input.bytes).toString("base64"),
        mimeType: input.mimeType,
      },
    },
  ];
}

function parseJson(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  return JSON.parse(withoutFence);
}

function normalizeExtraction(value: unknown): BillExtraction {
  const parsed = GeminiBillExtractionSchema.safeParse(value);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 8)
      .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
      .join("; ");
    throw new BillExtractionError(`Gemini response failed schema validation: ${issues}`);
  }

  const lineItems = parsed.data.lineItems.map((lineItem, index) => ({
    ...lineItem,
    id: `li_${index + 1}`,
  }));
  const lineItemTotal = lineItems.reduce((sum, lineItem) => sum + lineItem.billedCents, 0);
  const notes = [...parsed.data.notes];
  let totalBilledCents = parsed.data.totalBilledCents;

  if (lineItems.length > 0 && lineItemTotal !== totalBilledCents) {
    notes.push(
      `The printed total (${totalBilledCents} cents) differed from the extracted line-item sum (${lineItemTotal} cents); totalBilledCents uses the line-item sum.`,
    );
    totalBilledCents = lineItemTotal;
  }

  return BillExtractionSchema.parse({
    ...parsed.data,
    totalBilledCents,
    lineItems,
    notes,
  });
}

function validationMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 1_500);
  }
  return "The response was not valid JSON matching the schema.";
}

export async function extractBill(
  input: ExtractBillInput,
  options: ExtractBillOptions = {},
): Promise<BillExtraction> {
  await validateInput(input);

  const model = options.model ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  let generateContent = options.generateContent;

  if (!generateContent) {
    const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiConfigurationError();
    }

    const client = new GoogleGenAI({ apiKey });
    generateContent = (params) => client.models.generateContent(params);
  }

  const originalParts = sourceParts(input);
  let previousResponse = "";
  let previousError = "";

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const contents: Part[] =
      attempt === 0
        ? originalParts
        : [
            ...originalParts,
            {
              text: `Your previous response was invalid. Return corrected JSON only.\nValidation error: ${previousError}\nPrevious response:\n${previousResponse}`,
            },
          ];

    const response = await generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: GEMINI_RESPONSE_JSON_SCHEMA,
        temperature: 0,
      },
    });

    previousResponse = response.text ?? "";

    try {
      return normalizeExtraction(parseJson(previousResponse));
    } catch (error) {
      previousError = validationMessage(error);
    }
  }

  throw new BillExtractionError(
    `Gemini did not return a valid bill extraction after one repair attempt. ${previousError}`,
  );
}
