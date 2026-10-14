# TPA Voice Agent — MVP

A working voice agent for Third Party Administrators (TPAs) serving self-funded health plans. It handles the calls that eat up human support time — claims status, eligibility, benefits / deductible, ID cards, provider lookup, and prior auth — with verification, grounding, and clean human escalation.

**This MVP runs entirely on mock TPA data. No API keys, no phone setup, no real PHI.**

It is built to beat a generic voice toolkit (like VoiceGain's Casey) by being TPA-native: pre-built workflows, deterministic tools, plan-specific grounded answers, post-call actions, and payer-specific QA — not a blank IVR builder.

---

## For Ben — try it in 2 minutes (no engineering)

1. Open a terminal and run:
   ```bash
   npm install
   npm run dev
   ```
2. Open http://localhost:3000 in your browser
3. Press **Call**, then type:
   - `MBR1001` — member ID
   - `1985-03-14` — date of birth
   - `85004` — ZIP
4. Then try: `claims status`, `benefits`, `am I eligible?`, `I need a new ID card`, `find a cardiologist`, `prior auth status`
5. Try `I want to appeal` to see escalation — the agent connects you to a representative with a summary, so the caller never repeats themselves.

Demo members (all mock data):
- **Sarah Johnson** — MBR1001 / DOB 1985-03-14 / ZIP 85004 — PPO Gold, 2 approved + 1 pending claim
- **Carlos Mendoza (Spanish)** — MBR1002 / DOB 1978-11-02 / ZIP 85016 — HMO Silver, 1 denied claim
- **Emily Chen** — MBR1003 / DOB 1992-07-21 / ZIP 85281 — HDHP Bronze, high deductible
- MBR1004–MBR1008 also work — see `src/data/mockTpa.ts` for the full list.

Voice: turn on **Voice on (browser TTS)** to hear the agent speak, and **Mic** to talk instead of typing (Chrome / Edge only, Web Speech API). If mic is not supported, typing works exactly the same.

Language: switch to **Español** at the top to try the Spanish flow with Carlos or Maria.

---

## What the MVP does

- **Verification first:** Member ID + DOB + ZIP required before any PHI. 3 failed attempts → escalation. Never asks for or reads a full SSN.
- **Deterministic tools:** Every dollar amount, date, and status comes from a tool call (`getClaimStatus`, `getEligibility`, `getBenefits`, etc.), never from a guess. If no record exists, it says so and offers a transfer.
- **Intents:** claims status, eligibility, benefits / deductible / out-of-pocket, ID card reissue, provider lookup, prior auth status.
- **Escalation:** appeal / grievance, supervisor request, anger, medical emergency (advises 911), verification failure, low confidence, out-of-scope. Transfer includes member, verification status, intent, tool results, and reason.
- **Bilingual:** English + Spanish, with Spanish member auto-detection.
- **Transparency:** The demo UI shows live tool calls, call summary, audit log (with DOB/SSN redacted), and analytics (containment, intents, tool usage).
- **QA / eval:** 28 scripted scenarios in `eval/scenarios.json` + `npm run eval` + unit tests in `tests/`.

## What it is NOT yet

- Not connected to a real phone number, real claims system, or real LLM / STT / TTS providers. Those are production steps in `docs/DEPLOYMENT.md`.
- Not HIPAA-compliant for real PHI yet. The MVP uses fake data only. Do not put real member data in it until the deployment checklist is done.

---

## For engineers — quickstart

```bash
npm install
npm run dev      # http://localhost:3000 — browser phone simulator
npm test         # vitest unit tests
npm run eval     # 28 end-to-end scenarios, containment + guardrail checks
```

### API

- `POST /api/call/start` — `{ sessionId, language }` → greeting
- `POST /api/call/message` — `{ sessionId, text, language }` → `{ reply, state, verified, toolCalls, escalation, actions, suggestedReplies }`
- `GET /api/call/summary/:sessionId` — transcript + audit log + tool calls + escalation
- `POST /api/escalate` — `{ sessionId, reason }`
- `GET /api/analytics` — totals, containment %, intents, tool counts
- `GET /api/health` — `{ ok, mock, version }`

### Structure

```
server/index.ts          Express server + static frontend
src/agent/engine.ts      Deterministic state machine (GREETING → VERIFY → INTENT → TOOL → ANSWER)
src/agent/tools.ts       Deterministic tools — ONLY way agent gets facts
src/agent/guardrails.ts  PHI gate, escalation triggers, redaction, audit
src/agent/prompts.ts     SYSTEM_PROMPT for production LLM + EN/ES strings + NATO phonetic
src/data/mockTpa.ts      Mock members, claims, plans, providers, prior auths
src/api/routes.ts        REST wrapper over engine
public/                  Phone simulator UI (text + Web Speech + browser TTS)
tests/agent.test.ts      Unit tests
eval/scenarios.json      28 scenarios
eval/run-eval.ts         Eval runner
docs/ARCHITECTURE.md     How it works + production voice stack
docs/DEPLOYMENT.md       From demo → live phone, HIPAA checklist
```

### Production swap

Replace the bodies in `src/agent/tools.ts` with calls to your TPA API / claims admin system (HealthEdge, QicLink, etc.) via a secure gateway. Keep the same signatures and return shapes — the agent logic does not change. See `docs/ARCHITECTURE.md`.

### System prompt

The production LLM contract lives in `src/agent/prompts.ts` as `SYSTEM_PROMPT`. The MVP engine implements the same rules deterministically, so demo behavior matches production behavior.

---

## Next steps

1. Try the demo, run `npm run eval`, review `docs/ARCHITECTURE.md`
2. Connect one real TPA API (claims status first) behind `tools.ts`
3. Add Twilio webhook → `POST /api/call/message` (see `docs/DEPLOYMENT.md`)
4. Add real STT/TTS/LLM behind env vars in `.env.example`
5. Complete HIPAA checklist before any real PHI
