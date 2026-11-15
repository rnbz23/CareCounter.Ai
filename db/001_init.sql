CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS analyses_created_at_idx
  ON analyses (created_at DESC);

CREATE TABLE IF NOT EXISTS hospital_prices (
  id TEXT PRIMARY KEY,
  hospital_id TEXT NOT NULL,
  code TEXT NOT NULL,
  price_type TEXT NOT NULL CHECK (
    price_type IN ('gross', 'discounted_cash', 'payer_negotiated', 'medicare')
  ),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  unit_semantics TEXT,
  evidence_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hospital_prices_lookup_idx
  ON hospital_prices (hospital_id, code, price_type);

CREATE TABLE IF NOT EXISTS source_evidence (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
