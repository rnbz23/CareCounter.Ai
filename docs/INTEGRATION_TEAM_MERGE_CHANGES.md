# CareCounter integration branch — change log

**Branch:** `integration/team-merge`  
**Documented tip:** `776dced` — *fix: give ElevenLabs bill context via browser client tools*  
**Created:** 2026-11-14  
**Base:** `feature/backend` @ `4c989d7` (also tagged `pre-integration-backup`)  
**Remote:** pushed to `origin/integration/team-merge` at this tip

This document explains what was brought in from the three feature branches, how they were merged, and what wiring was added afterward so the app runs as one product.

---

## 1. Purpose

CareCounter was developed on three parallel branches:

| Owner | Branch | Role |
| --- | --- | --- |
| Raja (Codex) | `feature/backend` | APIs, Gemini, Neon, Bright Data ingest, pricing, contracts |
| Sahil (Cursor) | `feature/frontend` | Patient UI, upload, analysis workspace, plan page, voice shell |
| Sumedh (DeepSeek) | `feature/elevenlabs-language-support` | ElevenLabs `AgentRuntime`, languages, client tools |

Those branches worked in isolation. The integration branch combines them and **connects** the missing runtime seams (live API mode, hospital ID, voice composition, agent tools, assistance / action-plan routes, Neon reads from RSC).

The planning guide that drove this work is `docs/CARECOUNTER_TEAM_INTEGRATION_MASTER.md`. This file is the **as-built** record of what landed on `integration/team-merge`.

---

## 2. Source branch snapshots (pre-merge)

### 2.1 `feature/backend` (Raja) — integration base

**Head used as base:** `4c989d7` (`docs: add team integration master plan`)  
**Backup tag:** `pre-integration-backup` (same commit)

Already on this branch before UI/voice merges:

- `POST /api/analyze` — Gemini bill extraction + Zod contracts
- `GET /api/analyses/[analysisId]` and related analysis APIs
- Insurance update + agent-context endpoints
- Neon persistence (`src/lib/db/neon.ts`, `db/001_init.sql`)
- Duplicate detection + Sharp Memorial price comparison
- Bright Data unlocker client + offline ingest script
- Public resource / assistance evidence libraries
- Expanded shared contracts in `src/types/contracts.ts`
- Backend tests and Next 16 toolchain

### 2.2 `feature/frontend` (Sahil)

**Head merged:** `17a6ee6` — *Add CareCounter frontend UI with patient-first analysis and plan screens.*

Brought into the integration branch:

- Marketing / intake home (`src/app/page.tsx`)
- Upload flow (`UploadCard`, `DocumentStage`, language selector stub)
- Analysis workspace, findings, line items, assistance / payment cards
- Plan page (`src/app/analysis/[analysisId]/plan/page.tsx`)
- Focus helpers (`src/lib/analysis/focus.ts`)
- Browser API adapter (`src/lib/api/analysis.ts`) with mock toggle
- Demo fixture (`src/lib/mock/demo-analysis.ts`)
- Layout, motion, marketing components, Tailwind / global styles
- `VoicePanel.tsx` **preview shell only** (did not mount live ElevenLabs)

### 2.3 `feature/elevenlabs-language-support` (Sumedh)

**Head merged:** `c1323ed` — *feat: integrate ElevenLabs multilingual language support*

Note: this branch already descended from Sahil’s frontend commit, then added voice work.

Brought in:

- Full `AgentRuntime.tsx` on `@elevenlabs/react` (`ConversationProvider`)
- Client tools: `focus_target`, `clear_focus`, `refresh_case`
- Expanded `LanguageSelector` (en / es / zh / tl) + Vitest coverage
- `docs/ELEVENLABS_LANGUAGES.md`
- `@elevenlabs/react` dependency

**Not** on Sumedh’s branch at merge time (filled later on integration):

- `src/app/api/agent/tools/route.ts`
- `src/lib/insurance/logic.ts`
- Composition of `AgentRuntime` inside `VoicePanel`
- Assistance / action-plan HTTP routes used by client tools

---

## 3. Merge strategy (what was done)

Feature branches were **not** force-pushed or rewritten. Integration was a new branch:

```text
main
  └── feature/backend  ──►  integration/team-merge
                              ├── merge feature/frontend
                              ├── merge feature/elevenlabs-language-support
                              └── wiring commits (see §5)
```

### Timeline (author dates, Pacific)

| Time | Commit | Event |
| --- | --- | --- |
| 22:03:00 | `81a4a0f` | Merge frontend into backend base |
| 22:03:32 | `d11936e` | Merge ElevenLabs language support |
| 22:05:00 | `a3a2ded` | Live API + Sharp hospital wiring |
| 22:05:00 | `f70fdb1` | VoicePanel → AgentRuntime |
| 22:05:00 | `568bb21` | Agent tools route + insurance logic |
| 22:20:00 | `fcaaa54` | RSC loads analysis from Neon |
| 22:27:31 | `776dced` | Browser client tools + assistance / action-plan APIs (**current tip**) |

Later local voice-debugging commits (`af61521` … `fdcbc2b`) were **not** pushed and were reset off this branch so remote and local match `776dced`.

---

## 4. Merge commit details

### 4.1 `81a4a0f` — merge frontend into backend base

**Intent:** One installable Next app with Raja’s APIs and Sahil’s UI.

**Combined / regenerated:**

- Root package config: `package.json`, `package-lock.json`
- Tooling: `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`
- Env template: `.env.example`
- Ownership notes: `AGENTS.md`

**Added from frontend (high level):** ~40 UI/app paths under `src/app/**`, `src/components/**`, `src/lib/api`, `src/lib/analysis`, styles, and a stub `AgentRuntime.tsx` placeholder that Sumedh’s merge would replace.

**Conflict posture:** Few overlapping paths; root config was unioned manually. Backend toolchain versions were preferred where they differed.

### 4.2 `d11936e` — merge ElevenLabs language support

**Intent:** Replace the stub voice runtime with Sumedh’s real agent and language work.

**Added / updated:**

| Path | Change |
| --- | --- |
| `src/components/voice/AgentRuntime.tsx` | Full ElevenLabs runtime (~400+ lines) |
| `src/components/intake/LanguageSelector.tsx` | Multilingual list + first messages |
| `src/components/intake/LanguageSelector.test.ts` | Language contract tests |
| `docs/ELEVENLABS_LANGUAGES.md` | Language / runtime notes |
| `package.json` / lockfile | `@elevenlabs/react` |
| `vitest.config.ts` | Align with language tests |
| `AnalysisWorkspace.tsx` | Small glue for language wiring |

Backend package versions were kept; lockfile regenerated for ElevenLabs.

---

## 5. Post-merge wiring (the actual product glue)

Merges alone left known gaps from the master plan. These commits closed them.

### 5.1 `a3a2ded` — connect frontend to live analysis APIs

**Problem:** Mock mode / wrong hospital ID meant live Neon price matching and real analyses did not line up with the UI.

**Changes:**

- Default hospital on upload set to **`sharp-memorial-hospital`** (Raja’s Sharp price snapshot ID), not the demo hospital id.
- `AnalysisWorkspace` refetch / refresh path after voice or insurance mutations so the left pane stays on canonical Neon state.

**Files:** `UploadCard.tsx`, `AnalysisWorkspace.tsx`

### 5.2 `f70fdb1` — wire ElevenLabs runtime into analysis workspace

**Problem:** `AgentRuntime` existed but nothing rendered it. `VoicePanel` was still a preview mock.

**Changes:**

- `VoicePanel` kept: placement, branding, language selector.
- Live body replaced with `<AgentRuntime analysis language onFocus onUpdated onClearFocus />`.
- Removed preview-only controls so one voice path exists.

**Focus contract preserved:**

```ts
onFocus: (focus: FocusTarget) => string
// "focused" | "unknown_target" | "cleared"
```

IDs must come from the current `Analysis`; no transcript inference.

**Files:** `VoicePanel.tsx`

### 5.3 `568bb21` — protected agent tools + evidence-backed assistance logic

**Problem:** Spec required server tool endpoint and insurance / assistance / action-plan logic that neither frontend nor ElevenLabs branches owned fully.

**Added:**

| Path | Responsibility |
| --- | --- |
| `src/app/api/agent/tools/route.ts` | Allowlisted tool actions; `X-Agent-Tool-Secret` vs `ELEVENLABS_TOOL_SECRET` |
| `src/lib/insurance/logic.ts` | Deterministic assistance options + action plan from stored public evidence |
| `tests/agent-tools-auth.test.ts` | Auth / allowlist coverage |
| `tests/insurance-logic.test.ts` | Logic coverage |

This is the cloud / webhook-oriented tool surface. Local demos still prefer **browser client tools** (see `776dced`) because ElevenLabs cloud cannot call `localhost`.

### 5.4 `fcaaa54` — load analysis pages from Neon (not relative `/api` fetch)

**Problem:** After a successful `POST /api/analyze`, navigating to `/analysis/[id]` 404’d. Server Components were calling relative `/api/...` URLs, which do not resolve correctly in the RSC context.

**Changes:**

- Analysis and plan pages import `getAnalysis` from `@/lib/db/neon` instead of fetching the HTTP API.
- Upload success navigation aligned with that reality.

**Files:**  
`src/app/analysis/[analysisId]/page.tsx`,  
`src/app/analysis/[analysisId]/plan/page.tsx`,  
`UploadCard.tsx`

### 5.5 `776dced` — bill context via browser client tools (+ assistance / action-plan APIs)

**Problem:** Voice agent had no reliable case context on localhost; Bright Data is offline-only; server webhooks cannot reach the local Next server.

**Changes:**

1. **`AgentRuntime` client tools expanded** (in-browser):
   - `get_case_context` — builds compact agent context from the loaded `Analysis`
   - existing `focus_target` / `clear_focus` / `refresh_case`
   - `save_insurance_profile` → `POST /api/analyses/:id/insurance`
   - `get_assistance_options` → new assistance route
   - `generate_action_plan` → new action-plan route

2. **New analysis-scoped routes** (browser-callable, Neon-backed):
   - `POST /api/analyses/[analysisId]/assistance`
   - `POST /api/analyses/[analysisId]/action-plan`

3. **Docs:** `docs/ELEVENLABS_LANGUAGES.md` updated for local client-tool demo guidance.

---

## 6. End-to-end flow after integration

```text
[Offline] ingest-public-data.ts
    → Bright Data unlocker
    → Sharp prices + public assistance evidence
    → Neon

[Request] Upload (PDF / image / text)
    → POST /api/analyze (Gemini + duplicates + Sharp compare)
    → Neon analysis row
    → Navigate /analysis/:id

[RSC] getAnalysis(id) from Neon
    → AnalysisWorkspace (findings, charges, focus)
    → VoicePanel → AgentRuntime (ElevenLabs)
         client tools ↔ focus / refresh / insurance / assistance / action plan
```

**Ownership at runtime (unchanged):**

- Sahil: layout, focus scroll state, `VoicePanel` shell  
- Sumedh: `AgentRuntime`, languages, agent tool surface  
- Raja: analyze / analyses / Gemini / Neon / pricing / ingest  

Shared contracts remain Raja’s expanded schemas in `src/types/contracts.ts`.

---

## 7. Environment surface (combined)

`.env.example` on the integration tip documents:

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Server | Bill extraction |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Server | Neon |
| `BRIGHTDATA_API_KEY` / `BRIGHTDATA_UNLOCKER_ZONE` | Server | Offline ingest only |
| `NEXT_PUBLIC_USE_MOCK_ANALYSIS` | Browser | Must be exactly `false` for live APIs |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Browser | Public agent id |
| `ELEVENLABS_TOOL_SECRET` | Server | Protects `POST /api/agent/tools` |

Never put API keys or tool secrets in `NEXT_PUBLIC_*` variables.

---

## 8. What each branch “looks like” inside the integrated tree

### From Raja (kept / base)

- `src/app/api/analyze/**`
- `src/app/api/analyses/**` (plus assistance / action-plan added on integration)
- `src/lib/gemini/**`, `src/lib/pricing/**`, `src/lib/db/**`, `src/lib/data/**`
- `db/**`, ingest scripts, most backend tests
- Canonical `src/types/contracts.ts`

### From Sahil (merged then wired)

- `src/app/page.tsx`, `src/app/analysis/**` (pages later fixed to Neon)
- `src/components/intake/**`, `src/components/analysis/**`, layout / marketing / motion
- `src/components/voice/VoicePanel.tsx` (body replaced to mount AgentRuntime)
- `src/lib/api/analysis.ts`, `src/lib/analysis/focus.ts`, demo fixture

### From Sumedh (merged then extended)

- `src/components/voice/AgentRuntime.tsx` (extended with more client tools)
- Language selector + tests + `docs/ELEVENLABS_LANGUAGES.md`
- `@elevenlabs/react`

### Added only on integration (not on any single original feature tip)

- `src/app/api/agent/tools/route.ts`
- `src/lib/insurance/logic.ts`
- `src/app/api/analyses/[analysisId]/assistance/route.ts`
- `src/app/api/analyses/[analysisId]/action-plan/route.ts`
- Related tests under `tests/agent-tools-auth.test.ts`, `tests/insurance-logic.test.ts`
- Hospital ID + RSC Neon read + VoicePanel composition fixes

---

## 9. Explicitly out of scope / not on this tip

- Private ElevenLabs signed-URL / conversation-token auth (public agent id only).
- Verified live voice for Spanish / Chinese / Tagalog (configured only; English verified in docs).
- Request-time Bright Data calls during analyze or voice (offline ingest only).
- Later experimental voice WebRTC/websocket remount fixes after `776dced` (intentionally not pushed; branch reset to this tip).

---

## 10. How to verify this tip

```bash
git checkout integration/team-merge
git reset --hard origin/integration/team-merge   # should be 776dced

# Env: copy .env.example → .env.local and fill secrets;
# NEXT_PUBLIC_USE_MOCK_ANALYSIS=false

npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Smoke path:

1. Upload a bill with hospital **Sharp Memorial Hospital**.
2. Land on `/analysis/<id>` with findings (not 404).
3. Open voice panel → Start conversation (mic allowed).
4. Ask about a charge → `focus_target` highlights a left-pane id.
5. Optional: insurance save / assistance / action-plan via agent tools.

---

## 11. Related documents

| Doc | Role |
| --- | --- |
| `docs/CARECOUNTER_TEAM_INTEGRATION_MASTER.md` | Pre-merge plan and acceptance criteria |
| `docs/ELEVENLABS_LANGUAGES.md` | Language + local client-tool notes |
| `docs/RAJA_BACKEND_HANDOFF.md` | Backend handoff |
| `docs/SAHIL_CURSOR.md` / `docs/SUMEDH_DEEPSEEK.md` / `docs/RAJA_CODEX.md` | Per-owner task briefs |
| `AGENTS.md` | Path ownership on the living tree |

---

## 12. One-line summary

**`integration/team-merge` @ `776dced` = Raja’s backend base + Sahil’s UI + Sumedh’s ElevenLabs runtime, then wired for Sharp live analysis, Neon RSC reads, VoicePanel→AgentRuntime, protected agent tools, and localhost-safe browser client tools for case context / assistance / action plans.**
