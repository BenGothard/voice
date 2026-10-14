/**
 * Browser entry for GitHub Pages static demo.
 * Bundled with esbuild into pages/bundle.js as window.TPAAgent.
 * The static demo runs the SAME deterministic engine as the server —
 * no fetch, no backend, no API keys. All mock data is bundled.
 */
import { createSession, handleMessage, getSummary, type Session } from '../agent/engine.js';
import { createEscalation } from '../agent/tools.js';
import { audit } from '../agent/guardrails.js';

export { createSession, handleMessage, getSummary };

export function escalateSession(session: Session, reason = 'MANUAL') {
  const esc = createEscalation(reason, session.memberId, session.intent, 'Manual escalation from demo UI');
  session.escalation = esc;
  // @ts-expect-error — ESCALATE is a valid AgentState
  session.state = 'ESCALATE';
  audit(session.auditLog, 'ESCALATION', `Manual escalation: ${reason}`);
  return esc;
}

// Expose for the Pages demo
declare global {
  interface Window {
    TPAAgent: {
      createSession: typeof createSession;
      handleMessage: typeof handleMessage;
      getSummary: typeof getSummary;
      escalateSession: typeof escalateSession;
    };
  }
}

if (typeof window !== 'undefined') {
  window.TPAAgent = { createSession, handleMessage, getSummary, escalateSession };
}
