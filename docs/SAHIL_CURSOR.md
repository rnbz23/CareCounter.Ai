# SAHIL → CURSOR — Frontend/UI implementation prompt

You are implementing the production-looking UI of **CareCounter**, a 24-hour hackathon web application. Read `docs/MASTER_BUILD_SPEC.md`, `src/types/contracts.ts`, and `src/lib/mock/demo-analysis.ts` fully before writing code. Follow exact domain types and screen layouts; the master spec is the authority. This repo is shared with two developers; preserve their work.

**I am Sahil. I own:** Upload page, bill findings, side-by-side voice UI, synced visual highlighting, next-step plan screen, mobile layout. I use Cursor.

**Other owners:** Raja = backend/data/Gemini/Bright Data/Neon; Sumedh = ElevenLabs runtime/insurance dialogue. Do not implement their API internals or replace `AgentRuntime` with a mock after integration.

## Start work immediately

1. Create `src/app/page.tsx`: centered upload intake. Segmented PDF/image/text input; drag-and-drop/select; paste textarea; optional hospital selector; Analyze button. Accept only `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, max 5 MB. POST multipart `file` OR `text` to `/api/analyze`; show `Reading → Matching → Preparing` loading; navigate to `/analysis/${analysis.id}`. On error show readable Retry UI.
2. Create `src/app/analysis/[analysisId]/page.tsx`: fetch `GET /api/analyses/:id` (mock `DEMO_ANALYSIS` during backend setup). Desktop split EXACT **60% left / 40% right**, independently scrollable. Left has hospital/total header, findings and extracted line item cards; right has language picker, agent status, mic/mute/end buttons, transcript and insurance question widgets. Use `shadcn/ui` where quick. Ensure full desktop screen fits without excessive scroll.
3. Visual highlight contract: `const [activeFocus,setActiveFocus]=useState<FocusTarget|null>(null)`. Each line item/finding/assistance/plan card uses `id="target-${id}"`; when callback `onFocus` receives `{targetType,targetId}`, validate ID exists in the current `Analysis`; set state, apply visible outline/tint, scroll into view. **Never infer highlights from transcript text**. Provide `onFocus: (focus:FocusTarget)=>string` prop to Sumedh's `AgentRuntime`. Unknown IDs return `unknown_target`.
4. Design transitions: when `focus_target` points at a finding, show the finding + evidence excerpt / source link; when it points to assistance or plan step, scroll those cards into view. If PDF document preview exists, optionally show printed page/quote from `LineItem.anchor`; bounding boxes are optional, not P0.
5. Voice UI shell: `src/components/voice/VoicePanel.tsx` composes Sumedh-owned `<AgentRuntime analysis={analysis} language={language} onFocus={handleFocus} onUpdated={refetchAnalysis}/>`; you own layout, not provider tool setup. Use explicit `Start guide` permission action, status, transcript scroll. If agent disconnected, text analysis remains usable.
6. `src/app/analysis/[analysisId]/plan/page.tsx`: display `ActionPlan` payment summary, possible assistance with status badges, 3 priority steps, contact links and source timestamps. If `lowestConfirmedResponsibilityCents===null`, render **"Not established yet"**, never `$0` or a fabricated discount. Button to return to explanation.
7. Responsive behavior: desktop 60:40; tablets 50:50 if usable; mobile tabs `Findings | Document | Aid` with sticky voice controls. Keyboard focus/ARIA accessible, min contrast, empty/error/loading states.
8. Use fixture first; after Raja's API is merged, swap only fetching layer. After Sumedh's runtime is merged, verify an actual tool call highlights `finding_1`. Do not create multiple alternative focus-state stores.

## Components to implement

- `src/components/intake/UploadCard.tsx` (file+text source)
- `src/components/analysis/AnalysisSummary.tsx`
- `src/components/analysis/LineItemsTable.tsx`
- `src/components/analysis/FindingCard.tsx`
- `src/components/analysis/EvidenceCard.tsx`
- `src/components/analysis/AssistanceCard.tsx`
- `src/components/analysis/PaymentPathCard.tsx`
- `src/components/voice/VoicePanel.tsx` (shell ONLY)
- shared `formatCents(number|null)` util (display only; do not change backend cents)

## Visual style and exact behavior

Modern, calm and confident healthcare finance, not cluttered hospital ERP. White/surface gray, dark slate type, one blue/teal accent. High-contrast ring for active finding with label **"Guide is explaining this"**; other cards remain visible. Show up to three findings above fold. Source links are plain links with retrieved date; synthetic demo explicitly labeled. Primary CTA "Talk to my billing guide".

## Acceptance criteria

- Upload input validation and navigation work.
- With `DEMO_ANALYSIS`, all cards render valid numbers: `$2,110.00` etc; no float math.
- `handleFocus({targetType:'finding',targetId:'finding_1'})` outlines and scrolls correct card. Invalid ID no-ops; manually clicking finding also focuses it.
- Desktop and mobile layouts do not overflow horizontally.
- Uninsured/in-network/unknown insurance states render without crash.
- With Sumedh's ElevenLabs agent, spoken explanation and visual card highlight follow each other via client tool.
- `npm run build` succeeds; screenshots and short test instructions included in PR.

## Cursor instructions

Use Agent mode scoped to frontend directories. First inspect existing code and propose short file list; then implement. Do NOT reinitialize the repository or rewrite `contracts.ts`. Commit on `feature/sahil-ui`, not main. If API is absent, use shared fixture behind an explicit development flag. Do not invent source URLs, dollar savings, or fake ElevenLabs success. Report exact files modified and any integration props Raja/Sumedh need.
