import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

import {
  PublicPriceSnapshotRecordSchema,
  type HospitalPriceType,
  type PublicPriceSnapshotRecord,
} from "@/lib/data/public-prices";
import {
  AnalysisSchema,
  EvidenceSchema,
  type Analysis,
  type Evidence,
} from "@/types/contracts";

type Sql = NeonQueryFunction<false, false>;

export type { HospitalPriceType } from "@/lib/data/public-prices";

export interface HospitalPriceRow {
  id: string;
  hospitalId: string;
  code: string;
  priceType: HospitalPriceType;
  amountCents: number;
  unitSemantics: string | null;
  evidenceId: string;
}

export class DatabaseError extends Error {
  readonly code = "DATABASE_UNAVAILABLE";

  constructor(message = "The database is temporarily unavailable.", options?: ErrorOptions) {
    super(message, options);
    this.name = "DatabaseError";
  }
}

let cachedConnection: { url: string; sql: Sql } | null = null;

function database(): Sql {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new DatabaseError("DATABASE_URL is not configured.");
  }

  if (!cachedConnection || cachedConnection.url !== url) {
    cachedConnection = { url, sql: neon(url) };
  }

  return cachedConnection.sql;
}

async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }

    throw new DatabaseError(undefined, { cause: error });
  }
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  return run(async () => {
    const rows = await database().query(
      "SELECT payload FROM analyses WHERE id = $1 LIMIT 1",
      [id],
    );
    const row = rows[0] as { payload: unknown } | undefined;
    return row ? AnalysisSchema.parse(row.payload) : null;
  });
}

export async function saveAnalysis(analysis: Analysis): Promise<Analysis> {
  const validated = AnalysisSchema.parse(analysis);

  return run(async () => {
    await database().query(
      `INSERT INTO analyses (id, payload, created_at, updated_at)
       VALUES ($1, $2::jsonb, $3::timestamptz, NOW())
       ON CONFLICT (id) DO UPDATE
       SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [validated.id, JSON.stringify(validated), validated.createdAt],
    );
    return validated;
  });
}

export async function updateAnalysis(analysis: Analysis): Promise<Analysis> {
  const validated = AnalysisSchema.parse(analysis);

  return run(async () => {
    const rows = await database().query(
      `UPDATE analyses
       SET payload = $2::jsonb, updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [validated.id, JSON.stringify(validated)],
    );

    if (rows.length === 0) {
      throw new DatabaseError(`Analysis ${validated.id} does not exist.`);
    }

    return validated;
  });
}

export async function getHospitalPrices(
  hospitalId: string,
  code: string,
  priceType: HospitalPriceType,
): Promise<HospitalPriceRow[]> {
  return run(async () => {
    const rows = await database().query(
      `SELECT id, hospital_id, code, price_type, amount_cents,
              unit_semantics, evidence_id
       FROM hospital_prices
       WHERE hospital_id = $1 AND code = $2 AND price_type = $3
       ORDER BY amount_cents ASC`,
      [hospitalId, code, priceType],
    );

    return rows.map((row) => {
      const value = row as {
        id: string;
        hospital_id: string;
        code: string;
        price_type: HospitalPriceType;
        amount_cents: number;
        unit_semantics: string | null;
        evidence_id: string;
      };

      return {
        id: value.id,
        hospitalId: value.hospital_id,
        code: value.code,
        priceType: value.price_type,
        amountCents: value.amount_cents,
        unitSemantics: value.unit_semantics,
        evidenceId: value.evidence_id,
      };
    });
  });
}

export async function getSourceEvidence(ids: string[]): Promise<Evidence[]> {
  if (ids.length === 0) {
    return [];
  }

  return run(async () => {
    const rows = await database().query(
      "SELECT payload FROM source_evidence WHERE id = ANY($1::text[])",
      [ids],
    );
    return rows.map((row) =>
      EvidenceSchema.parse((row as { payload: unknown }).payload),
    );
  });
}

export async function savePublicPriceSnapshot(
  snapshot: PublicPriceSnapshotRecord[],
): Promise<void> {
  const validated = snapshot.map((record) =>
    PublicPriceSnapshotRecordSchema.parse(record),
  );
  if (validated.length === 0) return;

  return run(async () => {
    const sql = database();
    await sql.transaction((transaction) =>
      validated.flatMap(({ price, evidence }) => [
        transaction.query(
          `INSERT INTO source_evidence (id, payload, created_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE
           SET payload = EXCLUDED.payload, created_at = NOW()`,
          [evidence.id, JSON.stringify(evidence)],
        ),
        transaction.query(
          `INSERT INTO hospital_prices
             (id, hospital_id, code, price_type, amount_cents,
              unit_semantics, evidence_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (id) DO UPDATE
           SET hospital_id = EXCLUDED.hospital_id,
               code = EXCLUDED.code,
               price_type = EXCLUDED.price_type,
               amount_cents = EXCLUDED.amount_cents,
               unit_semantics = EXCLUDED.unit_semantics,
               evidence_id = EXCLUDED.evidence_id,
               created_at = NOW()`,
          [
            price.id,
            price.hospitalId,
            price.code,
            price.priceType,
            price.amountCents,
            price.unitSemantics,
            price.evidenceId,
          ],
        ),
      ]),
    );
  });
}
