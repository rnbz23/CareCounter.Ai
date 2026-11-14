import { createAnalysis } from "@/lib/analysis/create";
import {
  assertBillSize,
  assertSupportedMimeType,
  BillInputError,
} from "@/lib/billing/input";
import {
  BillExtractionError,
  extractBill,
  GeminiConfigurationError,
  GeminiProviderError,
  type ExtractBillInput,
} from "@/lib/gemini/extract";

export const runtime = "nodejs";

type ErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ error: { code, message } } satisfies ErrorResponse, { status });
}

function stringField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function billInput(formData: FormData): Promise<ExtractBillInput> {
  const fileValue = formData.get("file");
  const text = stringField(formData, "text");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  if ((file && text) || (!file && !text)) {
    throw new BillInputError(
      "INVALID_INPUT_SELECTION",
      "Provide exactly one medical bill: either file or text.",
      400,
    );
  }

  if (text) {
    assertBillSize(Buffer.byteLength(text, "utf8"));
    return { inputType: "text", text };
  }

  if (!file) {
    throw new BillInputError("EMPTY_INPUT", "The uploaded bill is empty.", 400);
  }

  assertSupportedMimeType(file.type);
  assertBillSize(file.size);

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    return { inputType: "pdf", bytes, mimeType: file.type };
  }

  return { inputType: "image", bytes, mimeType: file.type };
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      "INVALID_FORM_DATA",
      "Send multipart/form-data containing either file or text.",
      400,
    );
  }

  try {
    const input = await billInput(formData);
    const extraction = await extractBill(input);
    const analysis = createAnalysis({
      extraction,
      inputType: input.inputType,
      hospitalId: stringField(formData, "hospitalId"),
    });

    return Response.json(analysis, { status: 201 });
  } catch (error) {
    if (error instanceof BillInputError) {
      return errorResponse(error.code, error.message, error.status);
    }

    if (error instanceof GeminiConfigurationError) {
      return errorResponse("GEMINI_NOT_CONFIGURED", error.message, 503);
    }

    if (error instanceof GeminiProviderError) {
      return errorResponse(
        error.retryable ? "GEMINI_UNAVAILABLE" : "GEMINI_REQUEST_FAILED",
        error.message,
        error.retryable ? 503 : 502,
      );
    }

    if (error instanceof BillExtractionError) {
      return errorResponse("EXTRACTION_INVALID", error.message, 422);
    }

    return errorResponse(
      "EXTRACTION_FAILED",
      "The bill could not be analyzed. Please try again.",
      502,
    );
  }
}
