/**
 * REST API — thin HTTP wrapper over the conversation engine.
 * The engine holds all business logic; routes only validate + map.
 */
import type { Express, Request, Response } from 'express';
import { createSession, handleMessage, getSummary, type Session, type AgentState } from '../agent/engine.js';
import { createEscalation } from '../agent/tools.js';
import { audit } from '../agent/guardrails.js';

// In-memory store for MVP. Production: Redis / DB with TTL + encryption.
export const sessions = new Map<string, Session>();

function getOrCreate(sessionId: string, language: 'en' | 'es'): Session {
  let s = sessions.get(sessionId);
  if (!s) {
    s = createSession(sessionId, language);
    sessions.set(sessionId, s);
  }
  return s;
}

export function registerRoutes(app: Express): void {
  // Main conversational endpoint — used by browser demo and (later) Twilio webhook.
  app.post('/api/call/message', (req: Request, res: Response) => {
    const { sessionId, text, language } = req.body ?? {};
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }
    const lang = language === 'es' ? 'es' : 'en';
    const session = getOrCreate(sessionId, lang);
    // If caller switches language mid-call, honour it
    if (language === 'es' || language === 'en') session.language = language;
    const reply = handleMessage(session, text, session.language);
    return res.json(reply);
  });

  // Start a call — returns greeting without needing user text
  app.post('/api/call/start', (req: Request, res: Response) => {
    const { sessionId, language } = req.body ?? {};
    if (!sessionId || typeof sessionId !== 'string') return res.status(400).json({ error: 'sessionId is required' });
    const lang = language === 'es' ? 'es' : 'en';
    const session = getOrCreate(sessionId, lang);
    // Use a synthetic first turn to get greeting
    const reply = handleMessage(session, 'hello', lang);
    // Remove the synthetic user turn from transcript for clean UI
    session.transcript = session.transcript.filter((t) => !(t.speaker === 'user' && t.text === 'hello'));
    return res.json(reply);
  });

  // Call summary + audit log
  app.get('/api/call/summary/:sessionId', (req: Request, res: Response) => {
    const s = sessions.get(req.params.sessionId);
    if (!s) return res.status(404).json({ error: 'session not found' });
    return res.json(getSummary(s));
  });

  // Manual escalation
  app.post('/api/escalate', (req: Request, res: Response) => {
    const { sessionId, reason } = req.body ?? {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
    const s = sessions.get(sessionId);
    if (!s) return res.status(404).json({ error: 'session not found' });
    const esc = createEscalation(reason ?? 'MANUAL', s.memberId, s.intent, 'Manual escalation from UI');
    s.escalation = esc;
    s.state = 'ESCALATE' as AgentState;
    audit(s.auditLog, 'ESCALATION', `Manual escalation: ${reason ?? 'MANUAL'}`);
    return res.json({ escalation: esc, state: s.state });
  });

  // Analytics — containment, intents, escalations (MVP: in-memory)
  app.get('/api/analytics', (_req: Request, res: Response) => {
    const all = [...sessions.values()];
    const total = all.length;
    const verified = all.filter((s) => s.verified).length;
    const escalated = all.filter((s) => s.state === 'ESCALATE' || s.escalation).length;
    const contained = total === 0 ? 0 : Math.round(((total - escalated) / total) * 100);
    const intents: Record<string, number> = {};
    for (const s of all) if (s.intent) intents[s.intent] = (intents[s.intent] ?? 0) + 1;
    const toolCounts: Record<string, number> = {};
    for (const s of all) for (const tc of s.toolCalls) toolCounts[tc.tool] = (toolCounts[tc.tool] ?? 0) + 1;
    return res.json({
      totalSessions: total,
      verifiedSessions: verified,
      escalatedSessions: escalated,
      containmentRatePct: contained,
      intents,
      toolCalls: toolCounts,
    });
  });

  // Health
  app.get('/api/health', (_req, res) => res.json({ ok: true, mock: true, version: '0.1.0' }));
}
