import { z } from "zod";

import { EvidenceSchema } from "@/types/contracts";

export const HospitalPriceTypeSchema = z.enum([
  "gross",
  "discounted_cash",
  "payer_negotiated",
  "medicare",
]);
export type HospitalPriceType = z.infer<typeof HospitalPriceTypeSchema>;

export const PublicPriceSnapshotRecordSchema = z
  .object({
    price: z.object({
      id: z.string().min(1),
      hospitalId: z.string().min(1),
      code: z.string().min(1),
      priceType: HospitalPriceTypeSchema,
      amountCents: z.number().int().nonnegative(),
      unitSemantics: z.string().nullable(),
      evidenceId: z.string().min(1),
    }),
    evidence: EvidenceSchema,
  })
  .superRefine(({ price, evidence }, context) => {
    if (price.evidenceId !== evidence.id) {
      context.addIssue({
        code: "custom",
        message: "Price evidenceId must match evidence.id.",
        path: ["price", "evidenceId"],
      });
    }
    if (
      price.hospitalId !== evidence.hospitalId ||
      price.code !== evidence.code ||
      price.priceType !== evidence.priceType ||
      price.amountCents !== evidence.amountCents
    ) {
      context.addIssue({
        code: "custom",
        message: "Price fields must match their evidence fields.",
        path: ["evidence"],
      });
    }
  });
export type PublicPriceSnapshotRecord = z.infer<
  typeof PublicPriceSnapshotRecordSchema
>;
