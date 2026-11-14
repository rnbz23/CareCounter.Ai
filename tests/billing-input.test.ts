import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import {
  assertBillSize,
  assertPdfPageLimit,
  assertSupportedMimeType,
  BillInputError,
  MAX_BILL_BYTES,
} from "@/lib/billing/input";

describe("bill input validation", () => {
  it("rejects unsupported content types", () => {
    expect(() => assertSupportedMimeType("text/html")).toThrow(BillInputError);
  });

  it("rejects bills larger than 5 MB", () => {
    expect(() => assertBillSize(MAX_BILL_BYTES + 1)).toThrowError(
      expect.objectContaining({ code: "FILE_TOO_LARGE", status: 413 }),
    );
  });

  it("rejects PDFs longer than five pages", async () => {
    const pdf = await PDFDocument.create();
    for (let page = 0; page < 6; page += 1) pdf.addPage();
    const bytes = await pdf.save();

    await expect(assertPdfPageLimit(bytes)).rejects.toMatchObject({
      code: "PDF_TOO_MANY_PAGES",
      status: 413,
    });
  });
});
