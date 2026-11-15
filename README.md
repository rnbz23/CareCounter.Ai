# CareCounter

CareCounter is a multilingual medical-bill review assistant. It extracts structured charges from a PDF, image, or pasted text; flags charges worth reviewing; and provides a voice-guided explanation that highlights the relevant area of the original bill as it speaks.

**Live app:** [carecounterai.health](https://carecounterai.health)

> CareCounter identifies questions a user may want to ask a billing office. It does not determine that a charge is incorrect and does not provide medical, legal, or financial advice.

## Features

- PDF, image, and text bill intake
- Gemini-powered structured extraction with Zod validation
- Duplicate-charge and public-price findings
- Original-document overlays linked to extracted line-item coordinates
- ElevenLabs voice guidance with synchronized bill highlighting
- Multilingual voice and transcript support
- Insurance, assistance, and next-step planning
- Neon persistence for analyses, prices, and supporting evidence
- Offline Bright Data ingestion for public hospital resources

## How it works

1. The user submits a bill to `POST /api/analyze`.
2. Gemini extracts the hospital, service date, total, and line items into the shared schema in `src/types/contracts.ts`.
3. CareCounter computes findings and saves the analysis in Neon.
4. The analysis workspace displays the original document on the left and the ElevenLabs guide on the right.
5. Voice tool calls reference stable finding and line-item IDs. The UI uses those IDs and extracted coordinates to focus the matching area of the bill.
6. Assistance and action-plan APIs enrich the saved analysis with evidence-backed next steps.

Bright Data is not called during bill analysis. It is used only by the offline ingestion script to fetch public price and assistance resources, which are then stored in Neon.

## Tech stack

- Next.js 16, React 19, TypeScript, and Tailwind CSS
- Gemini for bill extraction
- Neon Postgres for persistence and public-price evidence
- ElevenLabs for the conversational voice guide
- Bright Data Web Unlocker for offline public-data ingestion
- Zod for shared runtime contracts
- Vercel for production hosting

## Local development

### Requirements

- Node.js 20 or newer
- A Gemini API key
- A Neon Postgres database
- An ElevenLabs conversational agent
- Bright Data credentials only if running the public-data ingestion script

### Setup

```bash
npm ci
cp .env.example .env.local
# Add the required values to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Server only | Gemini API credential |
| `GEMINI_MODEL` | Server only | Gemini extraction model |
| `DATABASE_URL` | Server only | Pooled Neon connection for application traffic |
| `DATABASE_URL_UNPOOLED` | Server only | Direct Neon connection for migrations |
| `NEXT_PUBLIC_USE_MOCK_ANALYSIS` | Browser visible | Set to `false` to use the live analysis APIs |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Browser visible | Public ElevenLabs agent ID |
| `ELEVENLABS_TOOL_SECRET` | Server only | Protects `POST /api/agent/tools` |
| `BRIGHTDATA_API_KEY` | Server only | Bright Data credential for offline ingestion |
| `BRIGHTDATA_UNLOCKER_ZONE` | Server only | Bright Data Web Unlocker zone |

Never commit `.env.local`. Do not place API keys, database credentials, or `ELEVENLABS_TOOL_SECRET` in a `NEXT_PUBLIC_*` variable.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm test` | Run the Vitest test suite |
| `npm run typecheck` | Generate Next.js types and run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run ingest:public-data` | Fetch public resources through Bright Data and store them in Neon |

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Bill upload and text intake |
| `/analysis/[analysisId]` | Bill review, synchronized highlighting, and voice guide |
| `/analysis/[analysisId]/plan` | Assistance and next-step plan |
| `POST /api/analyze` | Extract, analyze, and persist a bill |
| `GET /api/analyses/[analysisId]` | Load a saved analysis |
| `POST /api/agent/tools` | Protected server tools for the ElevenLabs agent |

## Project structure

```text
src/app/                         Next.js pages and API routes
src/components/intake/           Bill intake UI
src/components/analysis/         Analysis workspace and document highlighting
src/components/voice/            ElevenLabs runtime and voice UI
src/lib/gemini/                  Structured bill extraction
src/lib/db/                      Neon data access
src/lib/analysis/                Findings, context, and analysis services
src/lib/data/                    Bright Data and public-resource helpers
src/lib/insurance/               Assistance and action-plan logic
src/types/contracts.ts           Shared Zod schemas and TypeScript types
db/                              Database migrations
scripts/                         Offline data-ingestion scripts
sampledata/                      Synthetic test bills
tests/                           Automated tests
docs/                            Implementation and integration notes
```

## Testing

Run the automated checks before merging:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

For an end-to-end check, upload a synthetic bill from `sampledata/`, confirm that the generated analysis survives a refresh, and verify that the voice guide highlights the correct line item.

## Deployment

The GitHub repository is connected to the Vercel project `carecounterai/carecounter-ai`.

- Pushes to feature branches create preview deployments.
- Merges to `main` deploy to [carecounterai.health](https://carecounterai.health).
- Production secrets are configured in Vercel, not committed to the repository.
- Environment-variable changes require a new deployment.

If the ElevenLabs agent uses the protected server-tool endpoint, configure it as:

```text
POST https://carecounterai.health/api/agent/tools
X-Agent-Tool-Secret: <ELEVENLABS_TOOL_SECRET>
```

Use synthetic data for demonstrations. Do not upload real patient bills until appropriate privacy, security, retention, and compliance controls are in place.
