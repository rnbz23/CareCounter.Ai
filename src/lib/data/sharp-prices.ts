import type { Readable } from "node:stream";

import { parse } from "csv-parse";

import {
  PublicPriceSnapshotRecordSchema,
  type HospitalPriceType,
  type PublicPriceSnapshotRecord,
} from "@/lib/data/public-prices";

export const SHARP_PRICE_INDEX_URL = "https://www.sharp.com/cms-hpt.txt";
export const SHARP_MEMORIAL_HOSPITAL_ID = "sharp-memorial-hospital";
export const SHARP_MEMORIAL_LOCATION = "Sharp Memorial Hospital";
/** CPT/HCPCS codes pulled from Sharp’s machine-readable file for price checks. */
export const SELECTED_CPT_CODES = [
  "36415",
  "70450",
  "71046",
  "71260",
  "72148",
  "76700",
  "80053",
  "84484",
  "85025",
  "85027",
  "93005",
  "93010",
  "96365",
  "99223",
  "E0303",
] as const;

type SharpIndexEntry = {
  locationName: string;
  sourcePageUrl: string;
  mrfUrl: string;
};

type CsvRow = Record<string, string>;

export function findSharpMachineReadableFile(
  indexText: string,
  locationName: string,
): SharpIndexEntry {
  const entries: SharpIndexEntry[] = [];
  let current: Partial<SharpIndexEntry> = {};

  for (const line of indexText.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key === "location-name") {
      if (current.locationName && current.sourcePageUrl && current.mrfUrl) {
        entries.push(current as SharpIndexEntry);
      }
      current = { locationName: value };
    } else if (key === "source-page-url") {
      current.sourcePageUrl = value;
    } else if (key === "mrf-url") {
      current.mrfUrl = value;
    }
  }

  if (current.locationName && current.sourcePageUrl && current.mrfUrl) {
    entries.push(current as SharpIndexEntry);
  }

  const match = entries.find((entry) => entry.locationName === locationName);
  if (!match) {
    throw new Error(`No machine-readable file found for ${locationName}.`);
  }

  for (const url of [match.sourcePageUrl, match.mrfUrl]) {
    if (new URL(url).protocol !== "https:") {
      throw new Error(`Machine-readable source URL must use HTTPS: ${url}`);
    }
  }

  return match;
}

function moneyCents(value: string): number | null {
  const normalized = value.replace(/[$,]/g, "").trim();
  if (!normalized) return null;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function selectedCode(row: CsvRow, allowlist: ReadonlySet<string>) {
  for (const index of ["1", "2", "3"]) {
    const code = row[`code|${index}`]?.trim();
    const codeType = row[`code|${index}|type`]?.trim().toUpperCase();
    if (code && allowlist.has(code) && ["CPT", "HCPCS"].includes(codeType)) {
      return { code, codeType };
    }
  }
  return null;
}

function snapshotRecord(input: {
  code: string;
  description: string;
  setting: string;
  codeType: string;
  priceType: HospitalPriceType;
  amountCents: number;
  sourceUrl: string;
  retrievedAt: string;
}): PublicPriceSnapshotRecord {
  const suffix = `${input.code}_${input.priceType}`;
  const evidenceId = `evidence_sharp_memorial_${suffix}`;

  return PublicPriceSnapshotRecordSchema.parse({
    price: {
      id: `price_sharp_memorial_${suffix}`,
      hospitalId: SHARP_MEMORIAL_HOSPITAL_ID,
      code: input.code,
      priceType: input.priceType,
      amountCents: input.amountCents,
      unitSemantics: `${input.setting || "unspecified setting"}; one listed service`,
      evidenceId,
    },
    evidence: {
      id: evidenceId,
      kind: "hospital_price",
      title: `${SHARP_MEMORIAL_LOCATION} ${input.description} ${input.priceType.replace("_", " ")}`,
      sourceUrl: input.sourceUrl,
      retrievedAt: input.retrievedAt,
      hospitalId: SHARP_MEMORIAL_HOSPITAL_ID,
      code: input.code,
      priceType: input.priceType,
      amountCents: input.amountCents,
      note: `Official machine-readable standard charge; ${input.codeType}; ${input.setting || "setting not specified"}.`,
    },
  });
}

export async function extractSharpSelectedPrices(input: {
  stream: Readable;
  sourceUrl: string;
  retrievedAt: string;
  codes?: readonly string[];
}): Promise<PublicPriceSnapshotRecord[]> {
  const codes = input.codes ?? SELECTED_CPT_CODES;
  const allowlist = new Set(codes);
  const records = new Map<string, PublicPriceSnapshotRecord>();
  const parser = input.stream.pipe(
    parse({
      columns: true,
      from_line: 3,
      bom: true,
      relax_column_count: true,
      skip_empty_lines: true,
    }),
  );

  for await (const rawRow of parser) {
    const row = rawRow as CsvRow;
    const match = selectedCode(row, allowlist);
    const settingNorm = row.setting?.trim().toLowerCase() ?? "";
    // Outpatient is preferred; inpatient fills gaps for hospital-stay codes
    // (e.g. initial hospital care, room charges) that never appear as outpatient.
    if (!match || (settingNorm !== "outpatient" && settingNorm !== "inpatient")) {
      continue;
    }

    const description = row.description?.trim() || `Code ${match.code}`;
    const setting = row.setting.trim();
    const candidates: Array<[HospitalPriceType, number | null]> = [
      ["gross", moneyCents(row["standard_charge|gross"] ?? "")],
      [
        "discounted_cash",
        moneyCents(row["standard_charge|discounted_cash"] ?? ""),
      ],
    ];

    for (const [priceType, amountCents] of candidates) {
      const key = `${match.code}:${priceType}`;
      if (amountCents === null) continue;
      const existing = records.get(key);
      if (existing) {
        const existingIsOutpatient = existing.price.unitSemantics
          ?.toLowerCase()
          .includes("outpatient");
        if (existingIsOutpatient || settingNorm !== "outpatient") continue;
      }
      records.set(
        key,
        snapshotRecord({
          code: match.code,
          description,
          setting,
          codeType: match.codeType,
          priceType,
          amountCents,
          sourceUrl: input.sourceUrl,
          retrievedAt: input.retrievedAt,
        }),
      );
    }

    if (codes.every((code) => records.has(`${code}:gross`))) {
      input.stream.destroy();
      parser.destroy();
      break;
    }
  }

  return [...records.values()].sort((left, right) =>
    `${left.price.code}:${left.price.priceType}`.localeCompare(
      `${right.price.code}:${right.price.priceType}`,
    ),
  );
}
