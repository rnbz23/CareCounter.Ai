# CareCounter Team Integration Master Plan

Version 1.0  
Prepared 2026-11-15  
Branches reviewed: `feature/backend`, `feature/frontend`, and `feature/elevenlabs-language-support`

## Purpose and decision

This document is the implementation and merge guide for combining Raja's backend, Sahil's frontend, and Sumedh's ElevenLabs language work into one working CareCounter application.

The repository does not have an unmanageable number of direct conflicts. Raja and Sahil changed only seven of the same paths. Sumedh's branch already contains Sahil's frontend commit and adds one later commit. The safest merge order is therefore:

1. Create an integration branch from `feature/backend`.
2. Merge `feature/frontend` and manually combine the seven shared configuration files.
3. Merge `feature/elevenlabs-language-support`.
4. Complete the runtime wiring described in this document.
5. Run the full API, UI, voice, insurance, assistance, and build acceptance suite before merging to `main`.

The principal risk is not Git conflict volume. The principal risk is that independently working parts are not yet connected at runtime. In particular, the current frontend voice shell does not render the implemented ElevenLabs runtime, and the ElevenLabs branch does not contain the protected server tool endpoint or insurance and action-plan services described by the original specification.

## 1 Current branch state

### 1.1 Raja backend

Branch: `feature/backend`  
Reviewed head: `c2b4b48`

Raja's branch is the recommended integration base because it contains the canonical expanded contracts, the live database configuration, the complete API surface, and the currently verified Next.js toolchain.

Implemented responsibilities:

- Bill intake validation for PDF, PNG, JPEG, WebP, and pasted text.
- Gemini extraction with structured output, retry handling, source anchors, and Zod validation.
- Stable `li_...` and `finding_...` identifiers.
- Deterministic duplicate detection.
- Evidence-backed hospital gross-price comparison.
- Neon persistence for analyses, price rows, and source evidence.
- Bright Data offline discovery and public-resource ingestion.
- Analysis read, line-item correction, insurance update, and agent-context APIs.
- Public assistance and insurer evidence retrieval service.
- Synthetic PDF and image fixtures.
- Forty passing backend tests, type checking, production build, and live Neon readback at the time of this audit.

Primary paths:

| Responsibility | Code path |
| --- | --- |
| Analyze endpoint | `src/app/api/analyze/route.ts` |
| Analysis read API | `src/app/api/analyses/[analysisId]/route.ts` |
| Reviewed line items | `src/app/api/analyses/[analysisId]/line-items/route.ts` |
| Insurance profile | `src/app/api/analyses/[analysisId]/insurance/route.ts` |
| Agent context | `src/app/api/analyses/[analysisId]/agent-context/route.ts` |
| Gemini extraction | `src/lib/gemini/extract.ts` |
| Duplicate and price comparison | `src/lib/pricing/compare.ts` |
| Neon price lookup | `src/lib/pricing/references.ts` |
| Neon persistence and evidence queries | `src/lib/db/neon.ts` |
| Bright Data client | `src/lib/data/bright-data.ts` |
| Sharp price parser | `src/lib/data/sharp-prices.ts` |
| Assistance and contact sources | `src/lib/data/public-resources.ts` |
| Offline ingestion | `scripts/ingest-public-data.ts` |
| Database schema | `db/001_init.sql` |

### 1.2 Sahil frontend

Branch: `feature/frontend`  
Reviewed head: `17a6ee6`

Implemented responsibilities:

- Upload page for PDF, image, and text.
- Language and hospital selectors.
- Progress, error, and navigation states.
- Results workspace with findings, charges, evidence, assistance cards, and mobile tabs.
- Stable focus validation and scrolling through `FocusTarget`.
- Plan page and responsive layout.
- A frontend analysis adapter that can call Raja's real APIs or return a demo fixture.
- A styled `VoicePanel` shell with preview behavior.

Primary paths:

| Responsibility | Code path |
| --- | --- |
| Intake page | `src/app/page.tsx` |
| Upload workflow | `src/components/intake/UploadCard.tsx` |
| Results page | `src/app/analysis/[analysisId]/page.tsx` |
| Results state and focus | `src/components/analysis/AnalysisWorkspace.tsx` |
| Focus validation and scrolling | `src/lib/analysis/focus.ts` |
| Browser API adapter | `src/lib/api/analysis.ts` |
| Voice layout shell | `src/components/voice/VoicePanel.tsx` |
| Plan page | `src/app/analysis/[analysisId]/plan/page.tsx` |
| Demo fixture | `src/lib/mock/demo-analysis.ts` |

Important integration facts:

- `src/lib/api/analysis.ts` already matches Raja's `POST /api/analyze` and `GET /api/analyses/:id` contracts.
- Real APIs are bypassed whenever `NEXT_PUBLIC_USE_MOCK_ANALYSIS` is not exactly `false`.
- The current hospital dropdown sends `hospital_demo_sd_01`, but Raja's live price snapshot uses `sharp-memorial-hospital`.
- `VoicePanel.tsx` currently renders preview controls. It does not import or render `AgentRuntime`.

### 1.3 Sumedh ElevenLabs language support

Branch: `feature/elevenlabs-language-support`  
Reviewed head: `c1323ed`

This branch is a descendant of Sahil's `feature/frontend` branch. It adds or changes nine paths after Sahil's commit.

Implemented responsibilities:

- ElevenLabs `ConversationProvider` runtime.
- Start, end, mute, microphone permission, transcript, and typed-message behavior.
- Client tools named `focus_target`, `clear_focus`, and `refresh_case`.
- Validation that focus IDs exist in the current `Analysis`.
- Language overrides and localized first messages for English, Spanish, Chinese, and Tagalog.
- Language tests and configuration documentation.

Primary paths:

| Responsibility | Code path |
| --- | --- |
| ElevenLabs runtime | `src/components/voice/AgentRuntime.tsx` |
| Language definitions | `src/components/intake/LanguageSelector.tsx` |
| Language tests | `src/components/intake/LanguageSelector.test.ts` |
| Runtime notes | `docs/ELEVENLABS_LANGUAGES.md` |

Important integration facts:

- English is the only language marked voice-verified in the branch documentation.
- Spanish, Chinese, and Tagalog are configured but not verified with live audio.
- The runtime expects `analysis`, `language`, `onFocus`, and `onUpdated`; it optionally accepts `onClearFocus`.
- No other file imports `AgentRuntime`, so the runtime is currently unreachable in the UI.
- The branch does not contain `src/app/api/agent/tools/route.ts`.
- The branch does not contain `src/lib/insurance/logic.ts` or equivalent assistance/action-plan generation.
- The branch uses a public `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`; private signed-session auth is not implemented.

## 2 Complete application flow and code responsibility

### 2.1 Public data preparation before the demo

This flow runs offline. It does not run during each bill upload.

1. `scripts/ingest-public-data.ts` starts the ingestion job.
2. `src/lib/data/bright-data.ts` calls Bright Data Web Unlocker for official index, financial-assistance, insurer, government, and nonprofit pages.
3. `src/lib/data/public-resources.ts` validates expected identity markers and creates contract-valid evidence records.
4. `src/lib/data/sharp-prices.ts` finds the official Sharp Memorial machine-readable file and streams selected CPT prices.
5. `src/lib/db/neon.ts` writes price rows and evidence to Neon.
6. Request-time analysis later reads this snapshot from Neon. A Bright Data outage does not break the demo request path.

Owner: Raja.

### 2.2 Bill upload and extraction

1. Sahil's `UploadCard.tsx` collects exactly one file or text input plus optional hospital ID.
2. Sahil's `src/lib/api/analysis.ts` creates multipart form data and calls `POST /api/analyze`.
3. Raja's analyze route validates selection, MIME type, byte size, and PDF page count.
4. `src/lib/gemini/extract.ts` sends the visible bill to Gemini and requests strict structured output.
5. Gemini output is validated by `BillExtractionSchema`. Missing printed codes remain `null`; amounts become integer cents.
6. Server code assigns stable line-item IDs and preserves page, quote, and optional normalized coordinates.

Owners: Sahil for browser intake; Raja for server validation and extraction.

### 2.3 Comparison and persistence

1. `src/lib/pricing/references.ts` queries Neon by exact hospital ID, printed billing code, and gross price category.
2. `src/lib/pricing/compare.ts` groups same-date, same-code or description, same-amount, same-quantity entries for possible duplicate detection.
3. The same comparator emits a price finding only when hospital, code, quantity semantics, and category match and the configured difference threshold is met.
4. Evidence IDs link findings to real source URLs and retrieval timestamps.
5. `src/lib/analysis/create.ts` assembles the canonical `Analysis` with unknown insurance, empty assistance options, and no action plan.
6. `src/lib/db/neon.ts` saves the `Analysis` JSON payload.
7. The API returns HTTP 201. Sahil navigates to `/analysis/{analysisId}`.

Owner: Raja.

### 2.4 Results display and highlighting

1. Sahil's results page loads `Analysis` through `getAnalysisById`.
2. `AnalysisWorkspace.tsx` renders findings, extracted charges, evidence, assistance cards, and plan navigation.
3. `src/lib/analysis/focus.ts` validates `FocusTarget` against the current analysis.
4. A valid target sets `activeFocus` and scrolls to `target-{id}`.
5. A finding can also identify related line items through `finding.lineItemIds`.
6. Gemini image anchors can later support an overlay. Card and row highlighting already works without a document overlay.

Owner: Sahil.

### 2.5 Voice conversation

1. The user selects a language before starting a call.
2. Sahil's `VoicePanel` must render Sumedh's `AgentRuntime` and pass the current analysis and callbacks.
3. `AgentRuntime` requests microphone access and starts an ElevenLabs session with `analysis_id`, language, and localized first message.
4. The ElevenLabs agent calls the client tool `focus_target` using an exact stable ID.
5. Sumedh's runtime validates the payload and calls Sahil's `onFocus` callback.
6. Sahil's UI highlights the correct finding, line item, assistance card, step, or payment summary.
7. Transcript display remains independent from focus state. No component should infer focus from transcript text.

Owners: Sahil owns layout and highlight state; Sumedh owns agent runtime and client tools.

### 2.6 Insurance, assistance, and action plan

The original specification requires this flow, but it is not complete in the reviewed branches.

Required final flow:

1. ElevenLabs calls a protected server tool operation with `analysisId`.
2. `src/app/api/agent/tools/route.ts` verifies `X-Agent-Tool-Secret` using constant-time comparison.
3. `get_case_context` calls Raja's analysis service or agent-context builder.
4. `save_insurance_profile` validates `InsuranceProfile` and persists it through Raja's service.
5. `get_assistance_options` calls `getPublicResourceEvidence` and deterministic Sumedh-owned assistance logic.
6. `generate_action_plan` creates three grounded steps and a payment summary without inventing eligibility or savings.
7. The updated analysis is saved in Neon.
8. Sumedh's client tool `refresh_case` invokes `onUpdated`.
9. Sahil refetches the analysis and re-renders `aid_...`, `step_...`, and payment targets.

Owners: Sumedh owns the protected tool route and deterministic assistance/plan logic. Raja owns the database and evidence services. Sahil owns refresh and display.

## 3 Integration boundaries

### 3.1 Sahil to Raja

The browser-facing boundary is `src/lib/api/analysis.ts`.

| Frontend operation | Raja endpoint |
| --- | --- |
| Submit bill | `POST /api/analyze` |
| Load case | `GET /api/analyses/:id` |
| Save reviewed charges | `PATCH /api/analyses/:id/line-items` |
| Save insurance profile | `POST /api/analyses/:id/insurance` |
| Load compact voice context | `GET /api/analyses/:id/agent-context` |

Integration requirements:

- Keep Raja's expanded `src/types/contracts.ts`, including `AgentContextSchema`.
- Set `NEXT_PUBLIC_USE_MOCK_ANALYSIS=false` in the integrated environment.
- Replace the demo hospital dropdown value with `sharp-memorial-hospital` for the known-good public-price demo.
- Preserve API error bodies shaped as `{error:{code,message}}`.
- Refetch after any server-side update; do not keep a UI-only insurance state.

### 3.2 Sahil to Sumedh

The component boundary is:

```ts
<AgentRuntime
  analysis={analysis}
  language={language}
  onFocus={handleFocus}
  onUpdated={refreshAnalysis}
  onClearFocus={clearFocus}
/>
```

Recommended immediate integration: make `VoicePanel` the layout owner and render `AgentRuntime` inside it. Sumedh's current runtime also renders a complete visual card, so the team must choose one presentation owner before coding:

- Recommended for hackathon speed: let `VoicePanel` delegate its live body to `AgentRuntime` and remove the preview controls when the agent ID is configured.
- Longer-term alternative: refactor `AgentRuntime` into a controller and expose status, transcript, and controls to Sahil's shell.

Do not keep both complete voice interfaces visible. Do not duplicate focus state inside `AgentRuntime`.

### 3.3 Sumedh to Raja

The server tool route should call Raja's services by import, not make browser-style HTTP round trips inside the same Next.js server.

Relevant services:

- `getAnalysis` and `updateAnalysis` in `src/lib/db/neon.ts`.
- `getPublicResourceEvidence` in `src/lib/db/neon.ts`.
- `buildAgentContext` in `src/lib/analysis/agent-context.ts`.
- `updateAnalysisInsurance` in `src/lib/analysis/update-insurance.ts`.

The assistance service should consume evidence kinds `hospital_assistance`, `insurer_contact`, `insurer_policy`, `government_program`, and `nonprofit_program`. It must return possibilities, not eligibility decisions.

## 4 Git overlap and resolution matrix

### 4.1 Raja and Sahil direct overlap

Only these seven paths were changed by both branches relative to `main`:

| Path | Resolution |
| --- | --- |
| `.env.example` | Combine all backend, frontend, and ElevenLabs variables. Never choose one side wholesale. |
| `.gitignore` | Combine both versions; keep `.neon`, `.env`, `.env.*`, build output, coverage, editor, and OS exclusions. Preserve `!.env.example`. |
| `AGENTS.md` | Keep the Next.js generated warning and add the team ownership and focus-interface rules. |
| `next.config.ts` | Keep the backend file and add `reactStrictMode: true`. |
| `package.json` | Manually union scripts and dependencies. Keep one compatible version for each shared package. |
| `package-lock.json` | Do not hand-edit conflict markers. Resolve `package.json`, remove conflict markers by choosing one temporary lock, then run `npm install` once to regenerate the final lock. |
| `tsconfig.json` | Start from Raja's strict working config, add frontend requirements only when the merged typecheck identifies them. |

### 4.2 Package version decision

Raja's branch currently uses Next 16.4.6, React 19.3.1, TypeScript 7.0.2, Zod 4.6.7, and Vitest 5.1.0. Sahil and Sumedh use older framework and validation versions.

Recommended decision: retain Raja's newer, already verified core versions and add the UI and voice dependencies:

- `@elevenlabs/react`
- `clsx`
- `lucide-react`
- `tailwind-merge`
- Tailwind, PostCSS, Autoprefixer, and compatible ESLint packages

Then run typecheck and build. If a vendor dependency is incompatible with Next 16 or TypeScript 7, adjust only that dependency or adapter after observing the actual error. Do not downgrade the whole backend preemptively.

The old `next lint` command should not be treated as a release gate under the merged Next 16 toolchain. Use ESLint directly or update the script after verifying the installed Next.js guidance.

### 4.3 Sumedh overlap

`feature/elevenlabs-language-support` already contains Sahil's commit. Merge Sahil first, then Sumedh. In that order, Sumedh's functional changes are limited to the later language/runtime commit. The likely shared conflicts are `.env.example`, `package.json`, and `package-lock.json`, because the integration branch will already have combined versions.

Keep Sumedh's versions of:

- `src/components/voice/AgentRuntime.tsx`
- `src/components/intake/LanguageSelector.tsx`
- `src/components/intake/LanguageSelector.test.ts`
- `docs/ELEVENLABS_LANGUAGES.md`

Review rather than blindly accept Sumedh's `AnalysisWorkspace.tsx` change; it only generalizes stored language restoration.

## 5 Recommended merge procedure

Do not merge any feature branch directly into `main`. Use a dedicated integration branch and create a backup tag before starting.

```bash
git fetch origin
git switch feature/backend
git pull --ff-only
git switch -c integration/team-merge
git tag pre-integration-backup

git merge --no-ff origin/feature/frontend
```

Resolve the seven shared files using the matrix above. Keep all non-conflicting UI files.

```bash
npm install
npm test
npm run typecheck
npm run build
git add .
git commit

git merge --no-ff origin/feature/elevenlabs-language-support
```

Resolve `.env.example` and `package.json` by union. Regenerate the lockfile again rather than hand-merging it.

```bash
npm install
npm test
npm run typecheck
npm run build
git add .
git commit
```

Then implement the runtime wiring in small commits:

1. Real frontend API mode and Sharp hospital ID.
2. `VoicePanel` to `AgentRuntime` composition.
3. Stateful analysis refresh through `onUpdated`.
4. Protected agent tool route.
5. Assistance and action-plan logic.
6. End-to-end tests and demo hardening.

Push only the integration branch and open one integration PR after the full gate passes.

## 6 Target merged codebase

```text
src/
  app/
    page.tsx                                      Sahil
    analysis/[analysisId]/page.tsx                Sahil
    analysis/[analysisId]/plan/page.tsx           Sahil
    api/analyze/route.ts                          Raja
    api/analyses/[analysisId]/route.ts            Raja
    api/analyses/[analysisId]/line-items/route.ts Raja
    api/analyses/[analysisId]/insurance/route.ts  Raja service boundary
    api/analyses/[analysisId]/agent-context/route.ts Raja
    api/agent/tools/route.ts                      Sumedh, required
    api/agent/auth/route.ts                       Sumedh, optional for private agent
  components/
    intake/                                       Sahil; language list coordinated with Sumedh
    analysis/                                     Sahil
    voice/VoicePanel.tsx                          Sahil shell
    voice/AgentRuntime.tsx                        Sumedh runtime
  lib/
    api/analysis.ts                               Sahil browser adapter to Raja APIs
    analysis/focus.ts                             Sahil focus authority
    analysis/create.ts                            Raja
    analysis/agent-context.ts                     Raja
    analysis/update-line-items.ts                 Raja
    analysis/update-insurance.ts                  Raja
    gemini/                                       Raja
    pricing/                                      Raja
    db/                                           Raja
    data/                                         Raja
    insurance/logic.ts                            Sumedh, required
    mock/demo-analysis.ts                         Shared fixture
  types/contracts.ts                              Shared canonical schema; Raja version wins
db/001_init.sql                                   Raja
scripts/ingest-public-data.ts                     Raja
tests/                                            Tests grouped by owning behavior
docs/                                             Shared implementation and integration docs
```

## 7 Final environment variable set

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Server only | Gemini extraction |
| `GEMINI_MODEL` | Server only | Configured Gemini model |
| `DATABASE_URL` | Server only | Pooled Neon application traffic |
| `DATABASE_URL_UNPOOLED` | Server only | Direct migration connection |
| `BRIGHTDATA_API_KEY` | Server only | Offline public-page retrieval |
| `BRIGHTDATA_UNLOCKER_ZONE` | Server only | Bright Data Web Unlocker zone |
| `NEXT_PUBLIC_USE_MOCK_ANALYSIS` | Browser visible | Must be `false` for integrated live API flow |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | Browser visible | Public ElevenLabs demo agent ID |
| `ELEVENLABS_TOOL_SECRET` | Server only | Protects the agent server-tool route |

Never place provider API keys or the tool secret in a `NEXT_PUBLIC_` variable.

## 8 Integration acceptance gates

### 8.1 Build and static gates

- One `package.json`, one regenerated `package-lock.json`, and one Vitest configuration.
- `npm test` passes backend, frontend, and language tests.
- `npm run typecheck` passes.
- `npm run build` passes.
- `.env.local` and `.neon` are not staged.

### 8.2 Upload and analysis gate

- Set `NEXT_PUBLIC_USE_MOCK_ANALYSIS=false`.
- Upload `sampledata/carecounter-synthetic-bill-v2.png` from the actual intake UI.
- Select Sharp Memorial Hospital.
- Confirm navigation to the real generated analysis ID.
- Confirm four lines, total $1,352.50, blank supply code, duplicate finding, and $950 versus $710 price finding.
- Refresh the page and confirm Neon returns the same analysis.

### 8.3 Voice and focus gate

- Start only after a user click and microphone approval.
- Confirm English audio and transcript.
- Confirm `focus_target` highlights the exact requested finding.
- Confirm an unknown target returns `unknown_target` without changing focus.
- Confirm `clear_focus` clears the UI.
- Test Spanish and one additional language with real audio before marking them verified.

### 8.4 Insurance and assistance gate

- Insured branch saves an `InsuranceProfile` and labels any EOB amount as user-provided.
- Uninsured branch retrieves hospital, government, and nonprofit evidence from Neon.
- No option claims confirmed eligibility without proof.
- `refresh_case` refetches the updated analysis.
- Assistance cards receive `aid_...` IDs and can be focused.
- Action plan contains three ordered `step_...` entries and no fabricated minimum payment.

### 8.5 Failure gate

- Gemini failure produces a friendly API error.
- Neon failure produces stable 503 JSON.
- Bright Data is not called in the bill request path.
- ElevenLabs failure leaves the text findings usable.
- The explicitly labeled mock path remains available as a fallback, but is disabled for the real demo.

## 9 How Codex can perform the merge

Codex can complete the integration safely in a new `integration/team-merge` branch while preserving all three feature branches.

The work can be performed in these reviewable stages:

1. Create the integration branch and merge Sahil's branch without committing unresolved files.
2. Resolve the seven shared root files according to this document.
3. Regenerate dependencies and run the first build gate.
4. Merge Sumedh's descendant branch and resolve its package and environment additions.
5. Wire the real API mode, Sharp hospital ID, live `AgentRuntime`, and case refresh.
6. Implement or integrate the missing agent tool route and insurance/action-plan logic.
7. Run automated tests and the synthetic-image end-to-end flow.
8. Report every conflict decision, modified path, test result, and remaining external dashboard step.

No feature branch needs to be deleted or rewritten. If a merge stage fails, the integration branch can be discarded and recreated from `feature/backend`; the source branches remain unchanged.

## 10 Team signoff checklist

- [ ] Raja confirms backend contracts, APIs, evidence semantics, and Neon queries.
- [ ] Sahil confirms UI layout, real API mode, refresh behavior, and focus rendering.
- [ ] Sumedh confirms `AgentRuntime`, tool names, language settings, and live audio.
- [ ] The team agrees whether `VoicePanel` or `AgentRuntime` owns the rendered voice card.
- [ ] The protected agent server tools and assistance/action-plan logic are present.
- [ ] All environment variables are configured without committing secrets.
- [ ] One complete image or PDF demo works through upload, analysis, voice focus, insurance, assistance, and plan.
- [ ] `npm test`, `npm run typecheck`, and `npm run build` pass on the integration branch.
- [ ] Only then is the integration PR merged to `main`.
