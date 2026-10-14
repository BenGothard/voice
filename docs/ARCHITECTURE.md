# Architecture

## Goal

A TPA voice agent that replaces human cost on repetitive calls without hallucinating benefits, leaking PHI, or trapping callers. The MVP proves the conversation + tool + guardrail logic with mock data. Production swaps the mock layer for real telephony, STT/TTS, LLM, and TPA APIs — without changing the agent contract.

## Mental model

```
Caller speaks
  → STT (browser Web Speech in demo, Deepgram in prod)
  → Conversation engine (state machine, deterministic in MVP)
  → Tools (mockTpa in MVP, real TPA API in prod)
  → Guardrails (PHI gate, escalation, redaction, audit)
  → TTS (browser speechSynthesis in demo, Cartesia / ElevenLabs in prod)
  → Caller hears reply
```

Latency target in production: <800ms turn gap, ideally <500ms. The MVP is not latency-optimized — it proves correctness first.

## MVP (what is in this repo)

```
Browser demo (public/)
  text input + Web Speech + browser TTS
    ↓ POST /api/call/message
Express (server/index.ts + src/api/routes.ts)
    ↓
Engine (src/agent/engine.ts)
  State: GREETING → VERIFY_ID → VERIFY_DOB → VERIFY_ZIP → AUTHENTICATED
         → INTENT → TOOL_CALL → ANSWER → FOLLOW_UP → END / ESCALATE
  Intent detection: keyword rules (deterministic, testable)
    ↓
Tools (src/agent/tools.ts) — ONLY source of facts
  verifyMember, verifyDob, verifyZip,
  getClaimStatus, getEligibility, getBenefits,
  requestIdCard, findProvider, getPriorAuthStatus, createEscalation
    ↓
Mock data (src/data/mockTpa.ts)
  8 members, 15 claims, 4 plans, 8 providers, 6 prior auths
    ↓
Guardrails (src/agent/guardrails.ts)
  canDisclosePhi(), detectEscalation(), redactForLog(), audit()
```

Sessions are in-memory (`Map`) in the MVP. Production needs Redis / DB with TTL + encryption.

## Why deterministic engine for MVP?

An LLM can drift, invent amounts, or skip verification. The MVP engine is a state machine with explicit tool calls, so every behavior is testable:

- No PHI before `verified === true`
- No dollar amount unless it came from a tool result in this turn
- Escalation rules are explicit regex + state checks
- 28 eval scenarios + unit tests cover happy paths, failures, and guardrails

In production, you have two options:

1. **Keep deterministic engine + LLM for NLU only:** LLM classifies intent and extracts entities (member ID, claim ID, specialty), engine still controls state, tools, and guardrails. Recommended for TPAs — safest.
2. **Full LLM agent with tool calling:** LLM drives the conversation with `SYSTEM_PROMPT` in `src/agent/prompts.ts` + function calling. Requires strict evals, because the LLM must never skip verification or invent amounts. Use only after the deterministic version passes evals.

Either way, `SYSTEM_PROMPT` is the contract: verification, grounding, NATO confirmation, escalation, and style.

## Production voice stack

```
PSTN / SIP (Twilio, Telnyx)
  → Media stream (Twilio Media Streams / SIP RTP)
  → STT streaming (Deepgram Nova-3, or Voicegain STT)
  → Orchestrator (LiveKit Agents or Pipecat)
    → LLM (GPT-4o / Claude) with tool calling, or deterministic engine + LLM NLU
    → Tools via TPA API gateway (see below)
  → TTS streaming (Cartesia Sonic, ElevenLabs)
  → Caller
```

Components to add for production:

- **Telephony:** Twilio number + webhook that maps `CallSid` → `sessionId`, forwards caller audio to STT, plays TTS back. See `docs/DEPLOYMENT.md`.
- **STT:** Streaming, with custom vocabulary for drug / provider / plan names, and good handling of member IDs.
- **VAD / barge-in:** Semantic VAD so callers can interrupt mid-sentence. The MVP has no barge-in — browser demo is turn-based.
- **TTS:** Calm, clear, slightly slower voice. Support English + Spanish voices.
- **LLM:** BYO model, tokens billed separately. Keep prompts short, use tool calling, never put PHI in training data.

## TPA API gateway (production)

Replace `src/data/mockTpa.ts` + tool bodies in `src/agent/tools.ts` with a gateway:

```
Tools → Gateway (auth, rate limit, audit, redaction)
      → Claims admin (HealthEdge, QicLink, etc.)
      → Eligibility / benefits service
      → Provider directory
      → Prior auth service
      → Ticketing / CRM for escalations
```

Rules:

- Gateway authenticates with service account, not caller credentials.
- Every tool call is logged (member masked, no full DOB/SSN).
- Gateway returns only the fields the agent needs — never full member records.
- If the gateway is down, the agent says so and offers transfer — never guesses.
- Keep tool signatures identical to MVP, so engine + tests keep passing.

## Data flow for a claims call (production)

1. Caller: "Where is my claim?"
2. Agent verifies: member ID → DOB → ZIP (tools: verifyMember, verifyDob, verifyZip)
3. Agent detects intent `claims_status`
4. Tool: `getClaimStatus(memberId)` → gateway → claims system → returns 3 claims
5. Agent answers with most recent claim, amounts from tool result only
6. Follow-up: "Anything else?" → if no, end; if yes, loop to intent
7. Summary + audit log saved; if escalated, summary sent to human queue via screen pop / ticket

## Security / compliance notes (MVP vs prod)

MVP: mock data only, no real PHI, in-memory sessions, no encryption, no BAA. Safe for demos.

Production: see `docs/DEPLOYMENT.md` — BAA with every vendor touching PHI, encryption in transit + at rest, redaction, retention, access controls, audit, and QA.

## Files

- `src/agent/engine.ts` — state machine, intent dispatch, reply formatting
- `src/agent/tools.ts` — tool signatures + mock implementations
- `src/agent/guardrails.ts` — PHI gate, escalation, redaction
- `src/agent/prompts.ts` — SYSTEM_PROMPT + strings + NATO
- `src/data/mockTpa.ts` — mock data + lookups
- `src/api/routes.ts` — HTTP wrapper
- `server/index.ts` — Express + static

## How to extend

- New intent: add to `detectIntent` + `engine.ts` dispatch + `tools.ts` + `scenarios.json` + test.
- New tool: add function in `tools.ts` with same `ToolResult` shape, wire into engine, add eval scenario.
- New language: add strings in `prompts.ts` `STRINGS`, add member with that language, add scenarios.
