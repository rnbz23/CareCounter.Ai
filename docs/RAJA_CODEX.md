# RAJA → CODEX — Backend/data implementation prompt

You are my senior TypeScript backend partner implementing **CareCounter**, a 24-hour hackathon project. This is a real GitHub repository, not a sample exercise. Read `docs/MASTER_BUILD_SPEC.md`, `src/types/contracts.ts`, and `src/lib/mock/demo-analysis.ts` before editing. Master spec wins on all names and API contracts. Do not alter other teammates' files.

**I am Raja. I own:** Gemini extraction, Neon database, Bright Data public data ingestion, billing price comparison engine, core case APIs, optional Mastra.

**Other team members:** Sahil (Cursor) owns frontend intake/result/plan and highlight state; Sumedh (DeepSeek) owns ElevenLabs runtime/agent/webhook/insurance dialogue. Their code must work with the canonical schema you commit. Absolutely no new duplicate domain interfaces.

## Immediate execution sequence

1. **Repository first commit**: if Next.js not initialized, create using TypeScript/App Router/Tailwind. Copy canonical `src/types/contracts.ts`, `src/lib/mock/demo-analysis.ts`, `db/001_init.sql`, `.env.example`, docs and AGENTS.md. Install `@google/genai`, `@neondatabase/serverless`, `zod`. Commit, push `main`, then tell teammates to branch. Do not write their UI.
2. Create `src/lib/db/neon.ts` using `neon(process.env.DATABASE_URL!)`. Create functions `getAnalysis(id)`, `saveAnalysis(analysis)`, `updateAnalysis(analysis)`, `getHospitalPrices(hospitalId,code,priceType)`, `getSourceEvidence(ids)`; all use parameterized queries. Use `analyses.payload JSONB` for initial fast persistence. Migration in `db/001_init.sql`.
3. Create `src/lib/gemini/extract.ts`: `extractBill({inputType,bytes?,mimeType?,text?}): Promise<BillExtraction>`. Process PDF/image with `inlineData`; text as text. Prompt only visible printed data; no invented CPT codes. All dollar values become integer cents. Validate with `BillExtractionSchema.safeParse`. Support retry once on invalid JSON. Do not send patient names/IDs into logs. Test on one synthetic bill.
4. Implement `src/lib/pricing/compare.ts`: `compareBill(extraction, priceRows, sourceEvidence): {findings:Finding[], evidence:Evidence[]}`. Detect same-day repeated line items; conservative matching of code/hospital/type; no mix of cash, gross, Medicare and payer-negotiated. If no confirmed price row, no fake price finding. `finding_1` IDs deterministic, same source IDs preserved.
5. Implement `POST /api/analyze` (form-data `file` OR `text` + optional `hospitalId`) returning `AnalysisSchema` 201; `GET /api/analyses/[analysisId]`; `PATCH .../line-items` to recompute findings; `POST .../insurance` (store typed profile; call Sumedh's assistance service if present, otherwise leave empty until PR); `GET .../agent-context`. Make a temporary fixture route if keys absent, clearly labeled demo.
6. Implement Bright Data ingestion **offline** in `scripts/ingest-public-data.ts`: Web Unlocker API for public hospital price transparency pages + hospital charity care and insurer contact pages. Extract actual official source URLs, retrieval timestamp, hospital ID, code and `priceType`. For big files stream/download links separately and import only 8–12 well-matched codes. Save snapshot to Neon. Demo must not scrape at request time. Do not claim private medical records or live insurance benefits can be scraped.
7. **Only after all above works**, optionally integrate Mastra typed `extract → compare → persist` workflow. Keep direct service fallback.

## Required acceptance tests

- `POST /api/analyze` on one synthetic PDF returns valid `AnalysisSchema` and stored GET returns identical case.
- Text input missing codes remains `code: null` (no AI guessed code).
- Duplicates only flagged for matching code/description, amount and service date; no false flags for different dates.
- Prices are only compared when same hospital, billing code, unit semantics and price category; every public source has real URL and timestamp.
- Changing a line item through PATCH recomputes findings.
- DB connection failure produces stable 503/JSON error, never 200 success with a fake saved result.
- Code builds with `npm run build`; don't touch Sahil's components or Sumedh's voice adapter.

## API boundary to hand teammates

- `POST /api/analyze` → `Analysis`.
- `GET /api/analyses/:id` → `Analysis`.
- `PATCH /api/analyses/:id/line-items` `{lineItems:LineItem[]}` → `Analysis`.
- `POST /api/analyses/:id/insurance` `InsuranceProfile` → `Analysis`.
- `GET /api/analyses/:id/agent-context` → compact grounded context.

Use exact `AnalysisSchema`, `BillExtractionSchema`, `LineItem`, `Finding`, `Evidence`, `InsuranceProfile`, `AssistanceOption`, `ActionPlan`, `FocusTarget`. Money always integer USD cents.

## Output behavior for Codex

Inspect repository state, implement concrete files, run checks, report actual modified paths and test output. Make small commits on `feature/raja-backend` after the first shared bootstrap commit. When external credentials are missing, keep adapters typed, create fixture-backed tests, and report required env variables rather than pretending live calls succeeded. Don't ask routine questions; choose the simplest compatible implementation. Stop before modifying other ownership directories.
