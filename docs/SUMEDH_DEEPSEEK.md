# SUMEDH → DEEPSEEK — ElevenLabs/insurance implementation prompt

You are implementing the live voice and insurance-guidance subsystem of **CareCounter**, a 24-hour hackathon Next.js application. Read `docs/MASTER_BUILD_SPEC.md` and `src/types/contracts.ts` before generating changes. Your output must be actual implementation code with paths, not a generic design essay. Preserve existing files and do not create duplicate domain schemas.

**I am Sumedh. I own:** ElevenLabs conversational Agent, proactive explanation, language selection integration, protected tool lookups, insured/uninsured questionnaire and actions. I use DeepSeek. Raja owns case data and hospital/public sources; Sahil owns screen and focus state. Coordinate around their interfaces.

## Primary objective — working voice-highlight loop first

1. Create one ElevenLabs Agent via the dashboard. Configure first message and system prompt from master spec, supported multilingual languages, client tool `focus_target({targetType,targetId})` and server webhook tools. Select language **before** call start; test English, Spanish and one more language. ElevenLabs dashboard tool definitions must match client function names and parameter spellings exactly.
2. Build `src/components/voice/AgentRuntime.tsx`, client component. Props:

```ts
import type { Analysis, FocusTarget } from '@/types/contracts';
export type AgentRuntimeProps = {
  analysis: Analysis;
  language: string;
  onFocus: (p: FocusTarget) => string;
  onUpdated: () => Promise<void> | void;
};
```

Wrap with `<ConversationProvider>` and call `useConversationClientTool('focus_target', (params:FocusTarget)=>onFocus(params))` in a child component. Use `useConversationControls()` and status hooks from **current** `@elevenlabs/react` SDK (post-1.0 API). On clicking Start, request microphone and `startSession({agentId})` for public demo. For private production mode, call signed session auth endpoint (no exposed secret). Display real status/transcript. Provide End/Mute and graceful error state. Don't make UI focus depend on transcript matching.
3. Before voice integration with backend, use `DEMO_ANALYSIS` fixture and known IDs. Confirm the agent actually invokes `focus_target` as it mentions X-ray. Return `focused` or `unknown_target` for invalid IDs. The runtime must never call DOM directly; Sahil's callback controls UI.
4. Create `src/app/api/agent/tools/route.ts` (server-only). Receive JSON `AgentToolRequestSchema` discriminated union; verify header `X-Agent-Tool-Secret` against `ELEVENLABS_TOOL_SECRET` using constant-time comparison; route actions: `get_case_context`, `save_insurance_profile`, `get_assistance_options`, `generate_action_plan`. Return JSON `{ok:true,data:...}`. On error return typed failure. Call Raja's case services by import, not browser endpoint round trips. Configure server tool secret in ElevenLabs dashboard, never in public UI.
5. Implement `src/lib/insurance/logic.ts`: `buildAssistanceOptions(analysis, publicResourceRows):AssistanceOption[]` and `buildActionPlan(analysis):ActionPlan`. Insured branch: ask insurer, plan/tier optional, EOB, network. If user provides EOB responsibility, label it as user-provided rather than verified claims data. Find official insurer contact/appeals links from Raja's public evidence, otherwise ask user to check insurance card/member portal; no guessed number. Uninsured: ask state first, optionally household/income band, return hospital charity care, Medi-Cal/Medicaid and nonprofit program possibilities from public evidence. Never claim automatic eligibility.
6. If the agent saves insurance information, update Neon via Raja's typed service and call `onUpdated`/fetch from Sahil frontend for new cards. Use tool `focus_target` to highlight aid cards (`aid_1`) and action steps (`step_1`), not only charges.
7. Optional P1: agent auth route `/api/agent/auth` for private agent; use ElevenLabs signed URL/token from server. Don't block P0 on this unless API keys already configured.

## Exact proactive conversation

- Fetch case context FIRST; greet: "I reviewed your bill. Here are two items worth checking." (in user's chosen language).
- Call `focus_target` with `finding_1`; explain billed amount and public reference (only if evidence exists); pause for an interruption or question.
- Next `focus_target(finding_2)` and explain repeated charge.
- Ask "Do you have health insurance?" — single question. If yes: insurer name → EOB received → network if relevant → what patient may owe and what claim processing means → official insurer contact.
- If no: ask state → show hospital assistance and government/nonprofit possibilities with sources → provide most actionable next step.
- Build `ActionPlan` with three steps. Use `focus_target` on relevant assistance/steps as explained. Never give an exact minimum unless confirmed.
- Keep the voice calm, proactive, short, multilingual, interruptible and never pretend to be a hospital employee.

## Test this behavior

- Tool call to `focus_target` emits exact valid `{targetType:'finding',targetId:'finding_1'}`; wrong ID returns `unknown_target` and conversation continues.
- Agent proactively starts after Start press; browser mic permission works; start/end/restart works.
- Selected language works (test 3 in actual audio); do not promise mid-call language switching if SDK/config can't do it.
- Insurance question branches, persisted profile read back, accurate `actionPlan`, no fabricated phone number or claim amounts.
- Uninsured plan lists unconfirmed aid as `possible` and shows "not established yet" when minimum unknown.
- API key/server secret never appears in client bundle or logs. `npm run build` passes.

## DeepSeek output requirements

If you cannot directly edit the repo, give complete file-by-file code blocks (path at top) and exact environment/dashboard setup instructions so Sumedh can copy them into branch `feature/sumedh-voice`. Do not write entire unrelated frontend files, do not rewrite `contracts.ts`, and do not claim live API tests succeeded without executing them. When implementation details of ElevenLabs SDK differ from memory, use the official React SDK, client tools and webhook docs linked at the bottom of the master specification. Avoid boilerplate narrative; deliver runnable code, minimal setup steps, and explicit tests.
