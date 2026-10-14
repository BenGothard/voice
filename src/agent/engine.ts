/**
 * Conversation engine — deterministic state machine.
 * No LLM required for the MVP. Implements the same contract as SYSTEM_PROMPT.
 *
 * States: GREETING -> VERIFY_ID -> VERIFY_DOB -> VERIFY_ZIP -> AUTHENTICATED
 *        -> INTENT -> TOOL_CALL -> ANSWER -> FOLLOW_UP -> END / ESCALATE
 */
import { STRINGS, t, toNato, type Lang } from './prompts.js';
import { verifyMember, verifyDob, verifyZip, getClaimStatus, getEligibility, getBenefits, requestIdCard, findProvider, getPriorAuthStatus, createEscalation, normalizeDob, type Escalation } from './tools.js';
import { detectEscalation, isMedicalEmergency, canDisclosePhi, audit, type AuditEntry } from './guardrails.js';
import { findMember } from '../data/mockTpa.js';

export type AgentState =
  | 'GREETING'
  | 'VERIFY_ID'
  | 'VERIFY_DOB'
  | 'VERIFY_ZIP'
  | 'AUTHENTICATED'
  | 'INTENT'
  | 'TOOL_CALL'
  | 'ANSWER'
  | 'FOLLOW_UP'
  | 'END'
  | 'ESCALATE';

export type Session = {
  sessionId: string;
  state: AgentState;
  language: Lang;
  memberId?: string;
  memberName?: string;
  verified: boolean;
  intent?: string;
  transcript: { speaker: 'user' | 'agent'; text: string; ts: string }[];
  toolCalls: { tool: string; input: string; outputSummary: string; ts: string }[];
  auditLog: AuditEntry[];
  escalation?: Escalation;
  attempts: { id: number; dob: number; zip: number };
  createdAt: string;
  ended: boolean;
};

export type AgentReply = {
  reply: string;
  state: AgentState;
  language: Lang;
  verified: boolean;
  memberName?: string;
  intent?: string;
  toolCalls: Session['toolCalls'];
  escalation?: Escalation;
  actions: string[]; // e.g. ['SHOW_TOOL_CALLS','SHOW_ESCALATION','END_CALL']
  suggestedReplies: string[];
};

export function createSession(sessionId: string, language: Lang = 'en'): Session {
  const s: Session = {
    sessionId,
    state: 'GREETING',
    language,
    verified: false,
    transcript: [],
    toolCalls: [],
    auditLog: [],
    attempts: { id: 0, dob: 0, zip: 0 },
    createdAt: new Date().toISOString(),
    ended: false,
  };
  audit(s.auditLog, 'AGENT', 'Session created');
  return s;
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtDate(iso: string): string {
  // 2026-03-12 -> March 12, 2026
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

function extractMemberId(text: string): string | null {
  const m = text.toUpperCase().match(/MBR\s?[- ]?(\d{4})/);
  if (m) return `MBR${m[1]}`;
  // Also accept bare 4-digit + MBR context, or "1001"
  const bare = text.trim().match(/^(\d{4})$/);
  if (bare) return `MBR${bare[1]}`;
  return null;
}
function extractClaimId(text: string): string | null {
  const m = text.toUpperCase().match(/CLM[-\s]?(\d{4})/);
  if (m) return `CLM-${m[1]}`;
  return null;
}
function extractAuthId(text: string): string | null {
  const m = text.toUpperCase().match(/PA[-\s]?(\d{4})/);
  if (m) return `PA-${m[1]}`;
  return null;
}
function extractZip(text: string): string | null {
  const m = text.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}
function extractDob(text: string): string | null {
  // Try ISO / MDY / month-name via normalizeDob on substrings
  const iso = text.match(/\d{4}-\d{1,2}-\d{1,2}/);
  if (iso) return normalizeDob(iso[0]);
  const mdy = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
  if (mdy) return normalizeDob(mdy[0]);
  const mdy2 = text.match(/\d{1,2}-\d{1,2}-\d{4}/);
  if (mdy2) return normalizeDob(mdy2[0]);
  const monthName = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{1,2},?\s+\d{4}/i);
  if (monthName) return normalizeDob(monthName[0]);
  const dayMonth = text.match(/\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+\d{4}/i);
  if (dayMonth) return normalizeDob(dayMonth[0]);
  return normalizeDob(text.trim());
}

export type IntentName = 'claims_status' | 'eligibility' | 'benefits_deductible' | 'id_card' | 'provider_lookup' | 'prior_auth_status' | 'escalation' | 'unknown';

export function detectIntent(text: string): IntentName {
  const l = text.toLowerCase();
  // Use stem matching (no trailing word boundary) so Spanish plurals work:
  // reclamo/reclamos, beneficio/beneficios, elegibilidad, autorizacion, etc.
  if (/(claim|reclam)/.test(l)) return 'claims_status';
  if (/(eligib|elegib|coverage|covered|cobertura)/.test(l)) return 'eligibility';
  if (/(deductible|deducible|benefit|benefici|out.of.pocket|copay|bolsillo)/.test(l)) return 'benefits_deductible';
  if (/(id card|tarjeta|id-card|new card)/.test(l)) return 'id_card';
  if (/(provider|doctor|proveedor|médico|medico|cardiolog|dermatolog|radiolog|pediatric|orthopedic|physical therapy|urgent care|laboratory|in.network|in-network|network|find a )/.test(l)) return 'provider_lookup';
  if (/(prior auth|pre\.auth|preauth|prior authorization|autorizaci|auth)/.test(l)) return 'prior_auth_status';
  if (/(appeal|grievance|supervisor|human|representative|agent|representante|humano)/.test(l)) return 'escalation';
  return 'unknown';
}

function pushTranscript(s: Session, speaker: 'user' | 'agent', text: string) {
  s.transcript.push({ speaker, text, ts: new Date().toISOString() });
}

export function handleMessage(session: Session, userTextRaw: string, languageOverride?: Lang): AgentReply {
  const userText = userTextRaw.trim();
  if (languageOverride) session.language = languageOverride;
  const lang = session.language;
  pushTranscript(session, 'user', userText);
  audit(session.auditLog, 'USER', userText);

  const finish = (reply: string, actions: string[] = [], suggested: string[] = []): AgentReply => {
    pushTranscript(session, 'agent', reply);
    audit(session.auditLog, 'AGENT', reply);
    return {
      reply, state: session.state, language: lang, verified: session.verified,
      memberName: session.memberName, intent: session.intent,
      toolCalls: [...session.toolCalls], escalation: session.escalation,
      actions, suggestedReplies: suggested,
    };
  };

  const doEscalate = (reason: string): AgentReply => {
    session.state = 'ESCALATE';
    const esc = createEscalation(reason, session.memberId, session.intent, session.transcript.map((x) => `${x.speaker}: ${x.text}`).join(' | ').slice(0, 2000));
    session.escalation = esc;
    audit(session.auditLog, 'ESCALATION', `Escalated: ${reason}`);
    const msg = lang === 'es'
      ? `${t(lang, 'escalated')} (${reason})`
      : `${t(lang, 'escalated')} Reason: ${reason}.`;
    return finish(msg, ['SHOW_ESCALATION', 'END_CALL'], ['End call']);
  };

  // Global: medical emergency always escalates immediately
  if (isMedicalEmergency(userText)) {
    return finish(t(lang, 'emergency'), ['SHOW_ESCALATION'], ['Connect to representative']);
  }

  // Global: explicit escalation request (after greeting) — check before intent
  const escReason = detectEscalation(userText);
  if (escReason === 'APPEAL_OR_GRIEVANCE' || escReason === 'REQUEST_SUPERVISOR' || escReason === 'ANGER') {
    // Allow anger/appeal to escalate even before verification, but keep medical emergency handled above
    // Only escalate if user is not in the middle of verification with a bare ID/DOB/ZIP answer
    if (session.state !== 'VERIFY_ID' && session.state !== 'VERIFY_DOB' && session.state !== 'VERIFY_ZIP') {
      return doEscalate(escReason);
    }
    // If in verification, still honor supervisor/appeal requests
    if (escReason === 'APPEAL_OR_GRIEVANCE' || escReason === 'REQUEST_SUPERVISOR') return doEscalate(escReason);
  }

  // Goodbye handling
  if (/\b(bye|goodbye|adios|adiós|that's all|eso es todo|no,? (thanks|thank you)|no gracias)\b/i.test(userText) && session.verified) {
    session.state = 'END';
    session.ended = true;
    return finish(t(lang, 'goodbye'), ['END_CALL'], []);
  }

  switch (session.state) {
    case 'GREETING': {
      session.state = 'VERIFY_ID';
      // If user already gave an ID in first message, process it
      const id = extractMemberId(userText);
      if (id) {
        const res = verifyMember(id);
        if (res.ok && res.data) {
          session.memberId = res.data.memberId;
          session.memberName = `${res.data.firstName} ${res.data.lastName}`;
          if (res.data.language === 'es' && !languageOverride) session.language = 'es';
          session.state = 'VERIFY_DOB';
          session.toolCalls.push({ tool: 'verifyMember', input: id, outputSummary: `Found member ${session.memberName}`, ts: new Date().toISOString() });
          audit(session.auditLog, 'TOOL', `verifyMember ${id} -> found`);
          const confirm = `${t(session.language, 'idConfirm')} ${toNato(id)}, ${session.memberName}.`;
          return finish(`${confirm} ${t(session.language, 'askDob')}`, [], []);
        }
        session.attempts.id += 1;
        return finish(t(lang, 'notFoundId'), [], ['MBR1001', 'MBR1002', 'MBR1003']);
      }
      return finish(t(lang, 'greeting'), [], ['MBR1001', 'MBR1002', 'MBR1003']);
    }
    case 'VERIFY_ID': {
      const id = extractMemberId(userText);
      if (!id) {
        session.attempts.id += 1;
        if (session.attempts.id >= 3) return doEscalate('VERIFICATION_FAILED');
        return finish(t(lang, 'notFoundId'), [], ['MBR1001', 'MBR1002', 'MBR1003']);
      }
      const res = verifyMember(id);
      if (!res.ok || !res.data) {
        session.attempts.id += 1;
        if (session.attempts.id >= 3) return doEscalate('VERIFICATION_FAILED');
        return finish(t(lang, 'notFoundId'), [], ['MBR1001', 'MBR1002', 'MBR1003']);
      }
      session.memberId = res.data.memberId;
      session.memberName = `${res.data.firstName} ${res.data.lastName}`;
      if (res.data.language === 'es' && !languageOverride) session.language = 'es';
      session.state = 'VERIFY_DOB';
      session.toolCalls.push({ tool: 'verifyMember', input: id, outputSummary: `Found member ${session.memberName}`, ts: new Date().toISOString() });
      audit(session.auditLog, 'TOOL', `verifyMember ${id} -> found`);
      const confirm = `${t(session.language, 'idConfirm')} ${toNato(id)}, ${session.memberName}.`;
      return finish(`${confirm} ${t(session.language, 'askDob')}`, [], []);
    }
    case 'VERIFY_DOB': {
      const member = session.memberId ? findMember(session.memberId) : undefined;
      if (!member) { session.state = 'VERIFY_ID'; return finish(t(lang, 'notFoundId'), [], []); }
      const dob = extractDob(userText);
      if (!dob || !verifyDob(member, dob)) {
        session.attempts.dob += 1;
        if (session.attempts.dob >= 3) return doEscalate('VERIFICATION_FAILED');
        return finish(t(lang, 'wrongDob'), [], []);
      }
      session.state = 'VERIFY_ZIP';
      audit(session.auditLog, 'TOOL', 'verifyDob -> matched');
      return finish(t(lang, 'askZip'), [], []);
    }
    case 'VERIFY_ZIP': {
      const member = session.memberId ? findMember(session.memberId) : undefined;
      if (!member) { session.state = 'VERIFY_ID'; return finish(t(lang, 'notFoundId'), [], []); }
      const zip = extractZip(userText);
      if (!zip || !verifyZip(member, zip)) {
        session.attempts.zip += 1;
        if (session.attempts.zip >= 3) return doEscalate('VERIFICATION_FAILED');
        return finish(t(lang, 'wrongZip'), [], []);
      }
      session.verified = true;
      session.state = 'AUTHENTICATED';
      audit(session.auditLog, 'TOOL', 'verifyZip -> matched, verified');
      return finish(t(lang, 'verified'), [], lang === 'es' ? ['Estado de reclamos', 'Elegibilidad', 'Beneficios'] : ['Claims status', 'Eligibility', 'Benefits']);
    }
    case 'AUTHENTICATED':
    case 'INTENT':
    case 'TOOL_CALL':
    case 'ANSWER':
    case 'FOLLOW_UP': {
      // PHI gate — should already be verified, but enforce
      if (!canDisclosePhi(session.state) || !session.verified) {
        session.state = 'VERIFY_ID';
        return finish(t(lang, 'needVerification'), [], []);
      }
      // Follow-up yes/no
      if (session.state === 'FOLLOW_UP') {
        if (/^\s*(yes|yeah|sure|si|sí)\b/i.test(userText)) {
          session.state = 'INTENT';
          return finish(t(lang, 'askIntent'), [], lang === 'es' ? ['Estado de reclamos', 'Elegibilidad', 'Beneficios'] : ['Claims status', 'Eligibility', 'Benefits']);
        }
        if (/^\s*(no|nope|no thanks|no,?\s*thanks|no gracias)\b/i.test(userText)) {
          session.state = 'END';
          session.ended = true;
          return finish(t(lang, 'goodbye'), ['END_CALL'], []);
        }
      }

      const intent = detectIntent(userText);
      session.intent = intent;
      session.state = 'INTENT';

      if (intent === 'unknown') {
        return finish(t(lang, 'didNotUnderstand'), [], lang === 'es' ? ['Estado de reclamos', 'Elegibilidad', 'Beneficios'] : ['Claims status', 'Eligibility', 'Benefits']);
      }
      if (intent === 'escalation') return doEscalate('REQUEST_SUPERVISOR');

      // Dispatch to tools
      session.state = 'TOOL_CALL';
      const memberId = session.memberId!;
      let answer = '';
      let suggested: string[] = [];

      if (intent === 'claims_status') {
        const claimId = extractClaimId(userText);
        const res = getClaimStatus(memberId, claimId ?? undefined);
        if (!res.ok) return finish(t(lang, 'noRecord'), ['SHOW_TOOL_CALLS'], [t(lang, 'escalateOffer')]);
        session.toolCalls.push({ tool: 'getClaimStatus', input: claimId ?? `member ${memberId}`, outputSummary: `Returned ${Array.isArray(res.data) ? (res.data as unknown[]).length : 1} claim(s)`, ts: new Date().toISOString() });
        audit(session.auditLog, 'TOOL', `getClaimStatus ${memberId} -> ok`);
        if (Array.isArray(res.data)) {
          const claims = res.data as import('../data/mockTpa.js').Claim[];
          if (claims.length === 0) answer = t(lang, 'noRecord');
          else if (lang === 'es') {
            const lines = claims.slice(0, 3).map((c) => `${c.claimId} del ${fmtDate(c.dateOfService)} en ${c.provider}: ${c.status === 'approved' ? 'aprobado' : c.status === 'pending' ? 'pendiente' : 'denegado'}, facturado ${fmtMoney(c.amountBilled)}, pagado ${fmtMoney(c.amountPaid)}${c.status === 'denied' && c.denialReason ? `. Motivo: ${c.denialReason}` : ''}`);
            answer = `Encontré ${claims.length} reclamo(s). El más reciente: ${lines[0]}. ¿Quiere detalles de otro reclamo o que le enviemos el EOB?`;
          } else {
            const lines = claims.slice(0, 3).map((c) => `${c.claimId} from ${fmtDate(c.dateOfService)} at ${c.provider}: ${c.status}, billed ${fmtMoney(c.amountBilled)}, paid ${fmtMoney(c.amountPaid)}${c.status === 'denied' && c.denialReason ? `. Denial reason: ${c.denialReason}` : ''}${c.status === 'pending' ? ' — still processing' : ''}`);
            answer = `I found ${claims.length} claim(s). The most recent: ${lines[0]}.`;
            if (claims.length > 1) answer += ` Next: ${lines[1]}.`;
            answer += ` Would you like details on another claim, or an EOB emailed?`;
          }
        } else {
          const c = res.data as import('../data/mockTpa.js').Claim;
          answer = lang === 'es'
            ? `${c.claimId} del ${fmtDate(c.dateOfService)} en ${c.provider}: ${c.status === 'approved' ? 'aprobado' : c.status === 'pending' ? 'pendiente' : 'denegado'}, facturado ${fmtMoney(c.amountBilled)}, pagado ${fmtMoney(c.amountPaid)}${c.status === 'denied' && c.denialReason ? `. Motivo: ${c.denialReason}` : ''}`
            : `${c.claimId} from ${fmtDate(c.dateOfService)} at ${c.provider}: ${c.status}, billed ${fmtMoney(c.amountBilled)}, paid ${fmtMoney(c.amountPaid)}, patient responsibility ${fmtMoney(c.patientResponsibility)}${c.status === 'denied' && c.denialReason ? `. Denial reason: ${c.denialReason}` : ''}${c.paidDate ? `, paid on ${fmtDate(c.paidDate)}` : ''}.`;
        }
        suggested = lang === 'es' ? ['Elegibilidad', 'Beneficios'] : ['Eligibility', 'Benefits'];
      } else if (intent === 'eligibility') {
        const res = getEligibility(memberId);
        if (!res.ok || !res.data) return finish(t(lang, 'noRecord'), [], []);
        session.toolCalls.push({ tool: 'getEligibility', input: memberId, outputSummary: `Eligible=${res.data.member.eligible}`, ts: new Date().toISOString() });
        audit(session.auditLog, 'TOOL', `getEligibility ${memberId} -> ok`);
        answer = lang === 'es'
          ? `${res.data.member.firstName} ${res.data.member.lastName}, su cobertura ${res.data.member.eligible ? 'está activa' : 'no está activa'} en el plan ${res.data.plan?.name ?? res.data.member.planId}. ${res.data.member.eligibilityNote}`
          : `${res.data.member.firstName} ${res.data.member.lastName}, your coverage is ${res.data.member.eligible ? 'active' : 'not active'} on ${res.data.plan?.name ?? res.data.member.planId}. ${res.data.member.eligibilityNote}`;
        suggested = lang === 'es' ? ['Beneficios', 'Estado de reclamos'] : ['Benefits', 'Claims status'];
      } else if (intent === 'benefits_deductible') {
        const res = getBenefits(memberId);
        if (!res.ok || !res.data) return finish(t(lang, 'noRecord'), [], []);
        const d = res.data as { plan: import('../data/mockTpa.js').Plan; deductibleMetIndividual: number; deductibleRemainingIndividual: number; oopMetIndividual: number; oopRemainingIndividual: number };
        session.toolCalls.push({ tool: 'getBenefits', input: memberId, outputSummary: `Plan ${d.plan.name}, deductible met ${fmtMoney(d.deductibleMetIndividual)}`, ts: new Date().toISOString() });
        audit(session.auditLog, 'TOOL', `getBenefits ${memberId} -> ok`);
        answer = lang === 'es'
          ? `En su plan ${d.plan.name}: ha cumplido ${fmtMoney(d.deductibleMetIndividual)} de un deducible individual de ${fmtMoney(d.plan.deductibleIndividual)}, le quedan ${fmtMoney(d.deductibleRemainingIndividual)}. Ha cumplido ${fmtMoney(d.oopMetIndividual)} de un máximo de bolsillo de ${fmtMoney(d.plan.outOfPocketMaxIndividual)}. Copago: primaria ${fmtMoney(d.plan.copayPrimary)}, especialista ${fmtMoney(d.plan.copaySpecialist)}.`
          : `On your ${d.plan.name} plan: you have met ${fmtMoney(d.deductibleMetIndividual)} of your ${fmtMoney(d.plan.deductibleIndividual)} individual deductible, so ${fmtMoney(d.deductibleRemainingIndividual)} remains. You have met ${fmtMoney(d.oopMetIndividual)} of your ${fmtMoney(d.plan.outOfPocketMaxIndividual)} out-of-pocket maximum. Copays: primary ${fmtMoney(d.plan.copayPrimary)}, specialist ${fmtMoney(d.plan.copaySpecialist)}.`;
        suggested = lang === 'es' ? ['Elegibilidad', 'Estado de reclamos'] : ['Eligibility', 'Claims status'];
      } else if (intent === 'id_card') {
        const res = requestIdCard(memberId);
        session.toolCalls.push({ tool: 'requestIdCard', input: memberId, outputSummary: 'ID card reissue requested', ts: new Date().toISOString() });
        audit(session.auditLog, 'TOOL', `requestIdCard ${memberId} -> requested`);
        answer = lang === 'es'
          ? `He solicitado una nueva tarjeta de identificación. Llegará por correo en 7 a 10 días hábiles, y su tarjeta digital está disponible de inmediato.`
          : `I've requested a new ID card for you. It will arrive by mail in 7 to 10 business days, and your digital card is available immediately.`;
        suggested = lang === 'es' ? ['Elegibilidad', 'Beneficios'] : ['Eligibility', 'Benefits'];
      } else if (intent === 'provider_lookup') {
        // crude specialty extraction — map -ologist forms to -ology specialties
        const lower = userText.toLowerCase();
        const specMap: Record<string, string> = {
          cardiologist: 'cardiology',
          dermatologist: 'dermatology',
          radiologist: 'radiology',
          pediatrician: 'pediatrics',
          orthopedist: 'orthopedics',
        };
        let specialty: string | undefined;
        for (const [k, v] of Object.entries(specMap)) {
          if (lower.includes(k)) { specialty = v; break; }
        }
        if (!specialty) {
          const specMatch = lower.match(/(primary care|cardiology|radiology|physical therapy|urgent care|dermatology|laboratory|pediatrics|orthopedics)/);
          specialty = specMatch ? specMatch[1] : undefined;
        }
        const res = findProvider(specialty);
        const list = res.data as import('../data/mockTpa.js').Provider[];
        session.toolCalls.push({ tool: 'findProvider', input: specialty ?? 'any', outputSummary: `Returned ${list.length} providers`, ts: new Date().toISOString() });
        audit(session.auditLog, 'TOOL', `findProvider -> ${list.length} results`);
        if (list.length === 0) answer = t(lang, 'noRecord');
        else {
          const fmt = (p: import('../data/mockTpa.js').Provider) => `${p.name} — ${p.specialty}, ${p.address}, ${p.city} ${p.zip}, ${p.phone}, ${p.inNetwork ? (lang === 'es' ? 'en red' : 'in-network') : (lang === 'es' ? 'fuera de red' : 'out-of-network')}, ${p.distanceMiles} miles`;
          answer = lang === 'es' ? `Encontré ${list.length} proveedor(es): ${list.map(fmt).join('; ')}.` : `I found ${list.length} provider(s): ${list.map(fmt).join('; ')}.`;
        }
        suggested = lang === 'es' ? ['Elegibilidad', 'Beneficios'] : ['Eligibility', 'Benefits'];
      } else if (intent === 'prior_auth_status') {
        const authId = extractAuthId(userText);
        const res = getPriorAuthStatus(memberId, authId ?? undefined);
        if (!res.ok) return finish(t(lang, 'noRecord'), [], []);
        const auths = Array.isArray(res.data) ? (res.data as import('../data/mockTpa.js').PriorAuth[]) : [res.data as import('../data/mockTpa.js').PriorAuth];
        session.toolCalls.push({ tool: 'getPriorAuthStatus', input: authId ?? memberId, outputSummary: `Returned ${auths.length} auth(s)`, ts: new Date().toISOString() });
        audit(session.auditLog, 'TOOL', `getPriorAuthStatus ${memberId} -> ok`);
        if (auths.length === 0) answer = t(lang, 'noRecord');
        else {
          const fmt = (a: import('../data/mockTpa.js').PriorAuth) => `${a.authId} for ${a.service}: ${a.status}${a.decisionDate ? `, decided ${fmtDate(a.decisionDate)}` : `, requested ${fmtDate(a.requestedDate)}`}. ${a.notes}`;
          answer = lang === 'es' ? `Encontré ${auths.length} autorización(es) previa(s): ${auths.map(fmt).join(' ')}` : `I found ${auths.length} prior auth(s): ${auths.map(fmt).join(' ')}`;
        }
        suggested = lang === 'es' ? ['Estado de reclamos', 'Beneficios'] : ['Claims status', 'Benefits'];
      }

      session.state = 'FOLLOW_UP';
      const full = `${answer} ${t(lang, 'followUp')}`;
      return finish(full, ['SHOW_TOOL_CALLS'], suggested);
    }
    default: {
      return finish(t(lang, 'didNotUnderstand'), [], []);
    }
  }
}

export function getSummary(session: Session) {
  return {
    sessionId: session.sessionId,
    state: session.state,
    verified: session.verified,
    memberId: session.memberId ? `${session.memberId.slice(0, 3)}****${session.memberId.slice(-2)}` : undefined,
    memberName: session.memberName,
    language: session.language,
    intent: session.intent,
    toolCalls: session.toolCalls,
    escalation: session.escalation,
    transcript: session.transcript,
    auditLog: session.auditLog,
    ended: session.ended,
  };
}
