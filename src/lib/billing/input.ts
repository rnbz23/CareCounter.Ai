import { PDFDocument } from "pdf-lib";

export const MAX_BILL_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_PAGES = 5;

export const SUPPORTED_FILE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SupportedFileMimeType = (typeof SUPPORTED_FILE_MIME_TYPES)[number];

const SUPPORTED_MIME_TYPE_SET = new Set<string>(SUPPORTED_FILE_MIME_TYPES);

export class BillInputError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "BillInputError";
  }
}

export function assertSupportedMimeType(value: string): asserts value is SupportedFileMimeType {
  if (!SUPPORTED_MIME_TYPE_SET.has(value)) {
    throw new BillInputError(
      "UNSUPPORTED_FILE_TYPE",
      "Upload a PDF, JPEG, PNG, or WebP medical bill.",
      415,
    );
  }
}

export function assertBillSize(byteLength: number): void {
  if (byteLength === 0) {
    throw new BillInputError("EMPTY_INPUT", "The uploaded bill is empty.", 400);
  }

  if (byteLength > MAX_BILL_BYTES) {
    throw new BillInputError(
      "FILE_TOO_LARGE",
      "The bill must be 5 MB or smaller.",
      413,
    );
  }
}

export async function assertPdfPageLimit(bytes: Uint8Array): Promise<void> {
  let pdf: PDFDocument;

  try {
    pdf = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
  } catch {
    throw new BillInputError(
      "INVALID_PDF",
      "The PDF could not be read. Try exporting it again or upload an image.",
      400,
    );
  }

  if (pdf.getPageCount() > MAX_PDF_PAGES) {
    throw new BillInputError(
      "PDF_TOO_MANY_PAGES",
      "The PDF must contain 5 pages or fewer.",
      413,
    );
  }
}
