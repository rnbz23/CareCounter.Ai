# ElevenLabs language support

## Source of truth

`src/components/intake/LanguageSelector.tsx` owns the app's language list and
`LanguageCode` union. `AgentRuntime.tsx` imports that same list; there is no
second language table.

Each entry carries:

- `code` — ISO language code sent as `overrides.agent.language`.
- `label` — UI label.
- `firstMessage` — localized opener sent as `overrides.agent.firstMessage`.
- `verified` — `true` only after real browser audio has been exercised.

## Configured vs verified

| Code | Language | Configured | Voice verified |
| --- | --- | --- | --- |
| `en` | English | Yes | **Yes** |
| `es` | Español | Yes | Not yet |
| `zh` | 中文 | Yes | Not yet |
| `tl` | Tagalog | Yes | Not yet |

The non-English options are labeled **“(voice unverified)”** in the selector.
This distinction is intentional: configured options and localized first
messages are not proof that the ElevenLabs agent has the language enabled or
that its voice output is correct.

The current ElevenLabs dashboard agent has **English** as its default language.
Spanish, Chinese and Tagalog must be enabled in the agent's language settings
and tested with real audio before `verified` is changed to `true`.

## Runtime behavior

`AgentRuntime` starts a session with:

```ts
startSession({
  agentId,
  overrides: {
    agent: {
      language: toAgentLanguage(language),
      firstMessage: firstMessageForLanguage(language),
    },
  },
  dynamicVariables: { analysis_id: analysisId },
});
```

Language is selected **before** starting a session. Changing the selector
restarts `ConversationProvider` because the provider is keyed by language.

## Not implemented / not verified

- Mid-call language switching is not implemented. The user selects a language,
  then starts the conversation.
- Automatic language detection is not wired into the UI. The agent may detect a
  user's spoken language, but that is not a substitute for the explicit
  selection and is not covered by these tests.
- Spanish, Chinese and Tagalog voice quality, pronunciation and first-message
  audio have not been verified against the live agent.
- No claim is made that these languages are enabled in the ElevenLabs
  dashboard. English is the only verified language.
- The visible UI chrome (status labels, transcript scaffolding and buttons)
  remains English. Only the agent's greeting and spoken language follow the
  selector.
- `VoicePanel.tsx` is Sahil's shell and still renders its local preview
  controls in this branch. `AgentRuntime` is implemented and ready to be
  composed by the shell owner; this branch does not rewrite that layout.
- Private signed-URL agent auth is not included. The runtime uses the public
  `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` only.

## Environment

Set the public agent id at build time:

```bash
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_...
```

## Case context (local demo)

Bright Data is **offline ingestion only**. Bill details and Sharp price findings
are already stored in Neon and loaded into the browser Analysis object.

ElevenLabs **server/webhook tools cannot reach `localhost`**. For local demos,
configure these as **client tools** in the ElevenLabs dashboard (same names):

- `get_case_context` — returns the compact AgentContext JSON from the loaded case
- `focus_target` / `clear_focus` / `refresh_case`
- `save_insurance_profile` / `get_assistance_options` / `generate_action_plan`

Also pass dynamic variables: `analysis_id`, `hospital_name`, `case_brief`, etc.

Protected server route `POST /api/agent/tools` remains for cloud demos behind a
public URL (ngrok/tunnel) with header `X-Agent-Tool-Secret`.

Never commit `.env.local` or put an agent tool secret/API key in a
`NEXT_PUBLIC_` variable. `.env.example` contains placeholders only.

## Tests

```bash
npm test
npm run typecheck
npm run build
```

`LanguageSelector.test.ts` verifies the four configured codes, the
English-only `verified` flag, all localized first messages, and the fallback for
an unknown language.
