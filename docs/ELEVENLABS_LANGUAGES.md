# ElevenLabs language support

## Source of truth

`src/components/intake/LanguageSelector.tsx` owns the app's starting-language
list and `LanguageCode` union. `AgentRuntime.tsx` imports that same list; there
is no second language table.

Each entry carries:

- `code` — ISO language code used by presets and by the explicit switch turn.
  It is deliberately not sent as a session language override.
- `label` — UI label.
- `firstMessage` — localized opener sent as `overrides.agent.firstMessage`.
- `switchInstruction` — localized typed turn sent when the selector changes
  during a connected call.
- `verified` — `true` only after real browser audio has been exercised.

ElevenLabs uses `fil` for Filipino, so the selector shows “Filipino / Tagalog”
with the supported `fil` code.

## Configured starting languages

| Code | Language | Configured | Voice verified |
| --- | --- | --- | --- |
| `en` | English | Yes | **Yes** |
| `es` | Español | Yes | Not yet |
| `zh` | 中文 | Yes | Not yet |
| `fil` | Filipino / Tagalog | Yes | Not yet |
| `hi` | हिन्दी (Hindi) | Yes | Not yet |
| `vi` | Tiếng Việt | Yes | Not yet |
| `ko` | 한국어 | Yes | Not yet |
| `ar` | العربية | Yes | Not yet |
| `fr` | Français | Yes | Not yet |
| `pt` | Português | Yes | Not yet |

Non-English options are labeled **“(voice unverified)”** in the selector. This
is intentional: configured options and localized first messages are not proof
that the voice output is correct.

The ElevenLabs dashboard agent has **all available languages enabled** and the
**Detect language** system tool turned on. That allows the agent to switch to a
supported language when the caller speaks it or explicitly asks. English is
still the only language verified with real browser audio in this project.

## Runtime behavior

`AgentRuntime` starts a session with:

```ts
startSession({
  agentId,
  overrides: {
    agent: {
      firstMessage: firstMessageForLanguage(language),
    },
  },
  dynamicVariables: {
    analysis_id: analysisId,
    conversation_language: languageLabelForCode(language),
    conversation_language_code: language,
  },
});
```

Do **not** send `overrides.agent.language`. ElevenLabs treats a language
override as fixed for the whole call, so the **Detect language** tool returns
`Tool execution failed: OverrideError` when it tries to switch (this is visible
in conversation history). The localized first message plus the
`conversation_language` prompt variable establish the starting language; the
system tool is then free to switch the live output language.

`ConversationProvider` is not keyed by language, so changing the selector
during a connected call does not tear down the session. Instead,
`AgentRuntime` sends one localized `[LANGUAGE SWITCH]` turn that names the
target ISO code and tells the agent to call `language_detection` before
replying. The same tool handles a caller who simply starts speaking another
supported language.

The agent also switches automatically when the caller simply speaks another
enabled language. A caller can say “switch to Hindi” in English, or change the
dropdown; both paths use the same system tool.

## Hospital auto-detection

`src/lib/data/hospitals.ts` lists hospitals with ingested price snapshots.
`POST /api/analyze` resolves an explicit hospital selection first; when the UI
sends `auto`, it matches the hospital name extracted from the bill against
those aliases. Unsupported hospitals get `hospitalId: null`, so the app shows
findings without making a price claim.

Sharp Memorial Hospital is the only hospital with a price snapshot today.
Adding another hospital requires ingesting its prices into Neon and adding its
ID/aliases to `KNOWN_HOSPITALS`.

## Not implemented / not verified

- Mid-call language switching requires the agent's **Detect language** tool and
  a configured preset for every enabled language. Both are configured. The
  previous `OverrideError` was caused by the app's hard language override; that
  override has been removed and needs a fresh live audio check.
- The UI selector does not receive a language-change event back from
  ElevenLabs. If the agent auto-switches from speech, the selector may still
  show the starting language even though the agent is speaking the new one.
- Spanish, Chinese, Filipino, Hindi, Vietnamese, Korean, Arabic, French and
  Portuguese voice quality, pronunciation and first-message audio have not
  been verified against the live agent.
- The visible UI chrome (status labels, transcript scaffolding and buttons)
  remains English. Only the agent's greeting and spoken language follow the
  selector.
- Private signed-URL agent auth is not included. The runtime uses the public
  `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` only.

## Environment

Set the public agent id at build time:

```bash
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_...
```

Never commit `.env.local` or put an agent tool secret/API key in a
`NEXT_PUBLIC_` variable. `.env.example` contains placeholders only.

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

## Tests

```bash
npm test
npm run typecheck
npm run build
```

`LanguageSelector.test.ts` verifies the starting language codes, the
English-only `verified` flag, localized first messages, and mid-call switch
instructions. `tests/hospitals.test.ts` covers explicit and auto-detected
hospital selection.
