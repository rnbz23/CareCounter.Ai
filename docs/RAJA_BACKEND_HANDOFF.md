# CareCounter backend handoff

Raja's backend owns bill extraction, persistence, deterministic comparison, offline public-data ingestion, and the case APIs. All API responses use the canonical schemas in `src/types/contracts.ts`.

## Local setup

1. Copy `.env.example` to `.env.local` and fill the server-only credentials.
2. Run `neon deploy` (or `neon env pull`) to populate the Neon connection variables.
3. Run `npm run ingest:public-data` once to snapshot the selected Sharp Memorial prices and public assistance/contact resources into Neon.
4. Start the API with `npm run dev`.

Never expose these values through a `NEXT_PUBLIC_*` variable.

## API examples

Analyze a PDF:

```bash
curl -sS -X POST \
  -F 'hospitalId=sharp-memorial-hospital' \
  -F 'file=@sampledata/carecounter-synthetic-bill.pdf;type=application/pdf' \
  http://localhost:3000/api/analyze | python3 -m json.tool
```

Analyze pasted text:

```bash
curl -sS -X POST \
  -F 'text=Coastal Demo Hospital. Service date: 2026-11-10. Code 71046, Chest X-ray, quantity 1, $950.00.' \
  http://localhost:3000/api/analyze | python3 -m json.tool
```

Read an analysis or its compact voice-agent context:

```bash
curl -sS http://localhost:3000/api/analyses/ANALYSIS_ID | python3 -m json.tool
curl -sS http://localhost:3000/api/analyses/ANALYSIS_ID/agent-context | python3 -m json.tool
```

Update reviewed line items (the backend recalculates totals and findings):

```bash
curl -sS -X PATCH \
  -H 'Content-Type: application/json' \
  --data '{"lineItems":[{"id":"li_1","code":"71046","description":"Chest X-ray, two views","serviceDate":"2026-11-10","quantity":1,"billedCents":95000,"anchor":null,"extractionConfidence":"high"}]}' \
  http://localhost:3000/api/analyses/ANALYSIS_ID/line-items | python3 -m json.tool
```

Save an insurance profile:

```bash
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  --data '{"coverage":"uninsured","insurerName":null,"planName":null,"planTier":null,"networkStatus":null,"eobReceived":null,"eobPatientResponsibilityCents":null,"state":"CA","householdSize":null,"incomeBand":null}' \
  http://localhost:3000/api/analyses/ANALYSIS_ID/insurance | python3 -m json.tool
```

## Public-resource service boundary

Sumedh's server-side assistance logic should import `getPublicResourceEvidence` from `src/lib/db/neon.ts`. For a known hospital, the service returns matching hospital-scoped resources plus global insurer, government, and nonprofit resources. It does not determine patient eligibility.

## Verification

Run all local gates:

```bash
npm test
npm run typecheck
npm run build
```

Public data is ingested offline and read from Neon during requests. The live demo does not scrape public websites in the request path.
