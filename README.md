# CareCounter

**SanD Hacks Fall 2026** · [Event site](https://hackathon.csesatucsd.com) · [Devpost](https://sand-hacks-26.devpost.com/)

**Live app:** [carecounterai.health](https://carecounterai.health) · [GitHub](https://github.com/rnbz23/CareCounter.Ai) · [Vercel fallback](https://carecounter-ai.vercel.app)

Multilingual AI medical billing assistant. Upload a hospital statement, review flagged charges against public prices, talk with a billing guide that highlights line items as it speaks, and leave with a clear next-steps plan.

CareCounter surfaces **questions to ask** — never confirmed overcharges, guaranteed savings, or medical/legal advice. Patients should not share SSNs, member IDs, account numbers, or passwords with the app.

---

## Problem

Hospital bills are dense, coded, and stressful. Patients often cannot tell which charges are worth questioning, how public hospital prices compare, or where to find assistance — and calling billing without a plan is hard.

## Solution

CareCounter turns a statement into a guided review:

1. **Analyze** — Upload PDF, photo, or pasted charges.
2. **Understand** — Review the original bill in a scrollable left workspace while the separately scrollable voice guide stays fixed on the right. As the guide speaks, the bill automatically focuses and overlays the exact line item being discussed.
3. **Plan** — Get payment context, public assistance leads, and a short action checklist.

---

## SanD Hacks tracks we built for

You may submit to multiple tracks. CareCounter is built to compete in:

| Track | How we use it in CareCounter |
| --- | --- |
| **🏆 Best Overall Hack** | End-to-end product: intake → extraction → price/findings UI → multilingual voice guide → action plan, with a real demo path (not a slide-only pitch). |
| **Bright Data — Data for Good** | Offline ingest via Bright Data Web Unlocker snapshots **public** hospital price lists and assistance/contact pages into Neon. That evidence powers price-difference findings and assistance options so patients can investigate bills with real public sources — social impact without scraping on the live request path. |
| **ElevenLabs — Best Project Built with ElevenLabs** | Conversational **Hospital Billing Guide** (`AgentRuntime` + `@elevenlabs/react`): multilingual voice/text, client tools for `focus_target` / insurance / assistance / action-plan, and transcript UI that strips voice-delivery tags (e.g. `[friendly]`) so patients only see the spoken message. |
| **Neon — Best Database-Driven / Agent Backend** | Serverless Postgres for analyses, price rows, and public-resource evidence. Case APIs (`/api/analyze`, `/api/analyses/...`, `/api/agent/tools`) read/write Neon so the voice agent and UI share one durable backend. |
| **MLH — Best Use of Gemini API** | Gemini structured extraction (`src/lib/gemini/extract.ts`) turns PDF/image/text bills into validated line items and metadata (Zod schemas), with retry/repair — the foundation every later step uses. |

### Sponsor tech map (short)

- **Bright Data** → `src/lib/data/bright-data.ts`, `scripts/ingest-public-data.ts` (offline only; every team also receives event API credits).
- **ElevenLabs** → `src/components/voice/AgentRuntime.tsx`, `VoicePanel`, `POST /api/agent/tools`.
- **Neon** → `src/lib/db/neon.ts`, `db/001_init.sql`, analysis + evidence persistence.
- **Gemini** → `src/lib/gemini/extract.ts`, `POST /api/analyze`.

---

## Demo flow (for judges)

1. Open [carecounterai.health](https://carecounterai.health) → upload a synthetic bill from `sampledata/` (or paste charges).
2. Land on **Understand**: the document, synchronized overlays, and next steps scroll on the left; the billing guide remains fixed and independently scrollable on the right.
3. Ask about a flagged charge — the guide should **focus and highlight** the exact matching bill target (ID-based focus, not transcript guessing).
4. Open **Plan** for next steps, assistance leads, and checklist.
5. Optional: switch guide language via the language selector.

Synthetic fixtures (not real patient records):

- `sampledata/carecounter-synthetic-bill.pdf`
- `sampledata/carecounter-synthetic-bill.png` / `carecounter-synthetic-bill-v2.png`

---

## Stack

- **Next.js 16** / React 19 / TypeScript / Tailwind
- **Gemini** — bill extraction
- **Neon** — analyses, prices, public-resource evidence
- **Bright Data** — offline public-data ingest
- **ElevenLabs** — conversational billing guide
- **Zod** — shared contracts in `src/types/contracts.ts`
- **Vercel** — GitHub-connected Next.js production hosting and custom-domain TLS

---

## Production deployment

CareCounter is deployed from GitHub to Vercel:

| Item | Current production configuration |
| --- | --- |
| Source repository | [`rnbz23/CareCounter.Ai`](https://github.com/rnbz23/CareCounter.Ai) |
| Production branch | `main` |
| Vercel project | `carecounterai/carecounter-ai` |
| Primary URL | [https://carecounterai.health](https://carecounterai.health) |
| Additional URL | [https://www.carecounterai.health](https://www.carecounterai.health) |
| Vercel URL | [https://carecounter-ai.vercel.app](https://carecounter-ai.vercel.app) |
| Deployment trigger | Every push/merge to `main` |

The custom domain remains registered at Porkbun and uses these Vercel-provided DNS records:

| Type | Host | Value |
| --- | --- | --- |
| `A` | `@` | `216.198.79.1` |
| `A` | `@` | `64.29.17.1` |
| `CNAME` | `www` | `afbc59203def2919.vercel-dns-017.com` |

### Verified production checks

Verified against the deployed application on November 15, 2026:

- `GET /` returned HTTP `200` on the apex, `www`, and Vercel domains.
- A synthetic text bill passed through Gemini extraction (`POST /api/analyze`, HTTP `201`).
- The resulting analysis reloaded from Neon with the same ID and total (HTTP `200`).
- The protected ElevenLabs server-tool context path returned HTTP `200` with the configured secret.
- Bright Data remains outside the live request path and is used only by the offline ingest script.

### Deploying updates

Vercel automatically creates a preview deployment for non-production branches. Merge a tested pull request into `main` to deploy production:

```bash
git switch -c feature/my-change
git add .
git commit -m "Describe the change"
git push -u origin feature/my-change
```

After merging the pull request, verify the production deployment in Vercel and smoke-test [carecounterai.health](https://carecounterai.health). Environment-variable changes apply only to a new deployment, so redeploy after changing them.

---

## Quick start

```bash
npm ci
cp .env.example .env.local
# fill credentials (table below)

# Snapshot public Sharp prices + assistance sources into Neon (Bright Data offline path)
npm run ingest:public-data

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Never commit secrets or expose server keys as `NEXT_PUBLIC_*`.

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Server only | Gemini bill extraction |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Server only | Neon pooled application traffic + direct migration connection |
| `BRIGHTDATA_API_KEY` / `BRIGHTDATA_UNLOCKER_ZONE` | Server only, offline | Public-data ingest; not required by the live web request path |
| `NEXT_PUBLIC_USE_MOCK_ANALYSIS` | Browser visible | Must be exactly `false` for live APIs |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Browser visible | Public ElevenLabs agent ID |
| `ELEVENLABS_TOOL_SECRET` | Server only | Protects `POST /api/agent/tools` via `X-Agent-Tool-Secret` |

For Vercel Production, configure every variable above except the Bright Data pair, which is only needed where `npm run ingest:public-data` is executed. If the ElevenLabs dashboard uses the protected server tool, set its endpoint to:

```text
https://carecounterai.health/api/agent/tools
```

Configure the same server secret in its `X-Agent-Tool-Secret` request header. Never place this secret in a `NEXT_PUBLIC_*` variable.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local app |
| `npm run build` / `npm start` | Production |
| `npm test` | Vitest |
| `npm run typecheck` | Next typegen + `tsc` |
| `npm run lint` | ESLint |
| `npm run ingest:public-data` | Bright Data → Neon public prices/resources |

### Routes

| Path | Role |
| --- | --- |
| `/` | Home + upload |
| `/analysis/[id]` | Findings + billing guide |
| `/analysis/[id]/plan` | Next steps |

---

## Team

| Member | Focus |
| --- | --- |
| Sahil (SG2407) | Intake UI, two-pane analysis workspace, document overlays/highlighting, VoicePanel shell |
| Raja | Analyze APIs, Gemini, pricing, Neon, public-data ingest |
| Sumedh | ElevenLabs `AgentRuntime`, insurance/assistance logic, agent tools |

Shared contracts: `src/types/contracts.ts`. Focus callback:

```ts
onFocus: (focus: FocusTarget) => string
// "focused" | "unknown_target" | "cleared"
```

AgentRuntime must call `onFocus` with IDs from the current `Analysis` only.

---

## Devpost / event checklist (SanD Hacks)

Per the Hacker Guide:

- Submit on [Devpost](https://sand-hacks-26.devpost.com/) with: **3-minute public video**, short write-up, **GitHub repo**, optional live demo.
- Initial placeholder due **Sunday 11:00 AM**; final video/write-up/links due **Sunday 12:00 noon** — no project changes after noon.
- Stay in Slack; be present for check-in, judging, and awards (in-person).
- Judging is science-fair style: ~3 min present + ~2 min Q&A; criteria are Idea, Demo, Technical Complexity, Completion (not code-comment polish).

---

## Docs

- `docs/CARECOUNTER_TEAM_INTEGRATION_MASTER.md`
- `docs/RAJA_BACKEND_HANDOFF.md`
- `docs/ELEVENLABS_LANGUAGES.md`
- `docs/INTEGRATION_TEAM_MERGE_CHANGES.md`
- `AGENTS.md`
