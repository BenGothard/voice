# Deployment — from demo to live phone calls

## Current state

MVP demo: browser only, mock data, no phone, no real STT/TTS/LLM, no real PHI. Do not put real member data in the MVP.

## Path to production

### 1. Connect one real TPA API (first)

Pick claims status first — highest volume, simplest.

- Create a secure gateway (see `docs/ARCHITECTURE.md`) that calls your claims admin system.
- Replace the body of `getClaimStatus` in `src/agent/tools.ts` with a gateway call. Keep signature + return shape identical.
- Add integration tests with a staging TPA environment (never production PHI in tests).
- Run `npm run eval` — all scenarios should still pass, now against staging data.

Repeat for eligibility, benefits, provider, prior auth, ID card.

### 2. Add real telephony (Twilio example)

1. Buy a Twilio phone number.
2. Point its voice webhook to `https://your-domain.com/api/twilio/voice` (you will add this endpoint — it maps Twilio `CallSid` → `sessionId` and streams audio).
3. Use Twilio Media Streams to send caller audio to your STT provider and play TTS back.
4. On call end, Twilio posts to your status webhook — save summary + recording reference.
5. Test with Twilio test numbers + internal staff before routing real members.

The existing `POST /api/call/message` is the conversation core — Twilio webhook should call the same engine, not duplicate logic.

Alternatives: Telnyx, Vonage, or SIP trunk to your existing contact center (Genesys, Five9, etc.).

### 3. Add real STT / TTS / LLM

Set env vars from `.env.example`:

```bash
OPENAI_API_KEY=...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
TPA_API_BASE_URL=...
TPA_API_KEY=...
```

- STT: Deepgram Nova-3 streaming, or equivalent. Tune for member IDs, provider names, drug names.
- TTS: Cartesia Sonic or ElevenLabs. Choose calm English + Spanish voices.
- LLM: Use for intent classification + entity extraction first (deterministic engine stays in control). Only move to full LLM agent after evals pass with the deterministic version.
- Keep `SYSTEM_PROMPT` in `src/agent/prompts.ts` as the contract. Never send full SSN or unnecessary PHI to the LLM.

### 4. Human escalation

- Route escalations to your existing contact-center queue.
- Send screen pop: member (masked ID), verified status, intent, tool results, transcript summary, escalation reason.
- Log escalation reason + summary in your ticketing / CRM.
- Measure: transfer rate, time to human, repeat-contact rate (caller should never repeat themselves).

### 5. Observability + QA

- Log every session: state transitions, tool calls (masked), escalation, containment, duration.
- Sample 100% of calls for auto-QA against payer rubric: verification correct, no hallucinated amounts, escalation offered when required, summary accurate.
- Dashboard: containment %, CSAT, accuracy vs human QA, cost per resolved call.
- Alert on: spike in verification failures, spike in escalations, tool latency, STT errors.

### 6. Pilot

- Route 10–20% of live calls for ONE intent (claims status) to the agent.
- Compare: containment, CSAT, accuracy, AHT, cost per resolved call vs human baseline.
- Expand to eligibility → benefits → ID card → provider → prior auth, one at a time.
- Keep human fallback always available.

## HIPAA checklist (do before any real PHI)

- [ ] Sign BAA with every vendor that touches PHI (Twilio, STT, TTS, LLM, hosting, logging)
- [ ] Encrypt in transit (TLS) + at rest (DB, recordings, logs)
- [ ] Redact DOB / SSN / full member ID from logs; mask IDs in UI
- [ ] Access controls: least privilege, MFA, audit of who viewed what
- [ ] Retention: define call recording + transcript retention, then auto-delete
- [ ] Consent: "This call may be recorded..." prompt at start, per policy
- [ ] No training on PHI: disable training / logging in vendor dashboards
- [ ] Incident plan: breach notification, log review, rollback
- [ ] QA: human review of 100% of escalations + sample of contained calls
- [ ] Business Associate + vendor security review (SOC 2, PCI if payments)

This is a checklist, not legal advice. Have your compliance / security team review before go-live.

## Hosting

- MVP: `npm run start` on any Node 18+ host, single instance, in-memory sessions.
- Production: containerize, run behind TLS, use Redis / Postgres for sessions with TTL + encryption, autoscale on concurrent calls, separate staging vs production.
- Do not run production with in-memory sessions or mock data.

## Costs to plan for

- Telephony per-minute (Twilio / Telnyx)
- STT per-minute (Deepgram)
- TTS per-character / per-minute (Cartesia / ElevenLabs)
- LLM tokens (BYO provider)
- TPA API / gateway hosting
- Human QA + escalation handling (still needed — budget for it)

Track cost per *resolved* call, not per minute.
