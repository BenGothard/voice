/**
 * Guardrails — PHI gate, escalation triggers, redaction, audit logging.
 * These run BEFORE any tool that returns PHI and BEFORE any reply that
 * could contain PHI. Keep them strict: fail closed.
 */

export type EscalationReason =
  | 'APPEAL_OR_GRIEVANCE'
  | 'REQUEST_SUPERVISOR'
  | 'ANGER'
  | 'MEDICAL_EMERGENCY'
  | 'VERIFICATION_FAILED'
  | 'LOW_CONFIDENCE'
  | 'OUT_OF_SCOPE'
  | 'MANUAL';

const APPEAL_PATTERNS = [/\bappeal\b/i, /\bgrievance\b/i, /\bcomplaint\b/i, /\bdenied.*unfair/i, /\bdispute\b/i, /\blawsuit\b/i, /\blawyer\b/i, /\battorney\b/i, /\bapel/i, /\bqueja\b/i];
const SUPERVISOR_PATTERNS = [/\bsupervisor\b/i, /\bmanager\b/i, /\bhuman\b/i, /\brepresentative\b/i, /\bagent\b/i, /\bperson\b/i, /\brepresentante\b/i, /\bhumano\b/i];
const ANGER_PATTERNS = [/\bangry\b/i, /\bfrustrat/i, /\bterrible\b/i, /\bawful\b/i, /\buseless\b/i, /\bridiculous\b/i, /\bstupid\b/i, /\bthis is.*bad\b/i, /\benojad/i, /\bfrustrad/i, /\bterrible\b/i];
const EMERGENCY_PATTERNS = [/\bchest pain\b/i, /\bcan.?t breathe\b/i, /\btrouble breathing\b/i, /\bdifficulty breathing\b/i, /\bsevere bleeding\b/i, /\bunconscious\b/i, /\bheart attack\b/i, /\bstroke\b/i, /\bdolor.*pecho\b/i, /\bno puedo respirar\b/i];

export function detectEscalation(text: string): EscalationReason | null {
  if (EMERGENCY_PATTERNS.some((r) => r.test(text))) return 'MEDICAL_EMERGENCY';
  if (APPEAL_PATTERNS.some((r) => r.test(text))) return 'APPEAL_OR_GRIEVANCE';
  if (ANGER_PATTERNS.some((r) => r.test(text))) return 'ANGER';
  if (/\btalk to (a |the )?(supervisor|manager|human|person|representative|agent)\b/i.test(text)) return 'REQUEST_SUPERVISOR';
  if (SUPERVISOR_PATTERNS.some((r) => r.test(text)) && /\b(speak|talk|connect|transfer)\b/i.test(text)) return 'REQUEST_SUPERVISOR';
  return null;
}

export function isMedicalEmergency(text: string): boolean {
  return EMERGENCY_PATTERNS.some((r) => r.test(text));
}

/** PHI gate: only allow PHI disclosure when fully verified. */
export function canDisclosePhi(state: string): boolean {
  return state === 'AUTHENTICATED' || state === 'INTENT' || state === 'TOOL_CALL' || state === 'ANSWER' || state === 'FOLLOW_UP';
}

/** Redact sensitive values for logs / UI audit trail. Never log full DOB or SSN. */
export function redactForLog(text: string): string {
  let out = text;
  // SSN-like
  out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]');
  out = out.replace(/\b\d{9}\b/g, '[REDACTED-SSN]');
  // Full DOB YYYY-MM-DD
  out = out.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '[REDACTED-DOB]');
  // DOB MM/DD/YYYY
  out = out.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, '[REDACTED-DOB]');
  // Member ID -> show last 4 only
  out = out.replace(/\bMBR(\d{4})\b/gi, (_, d) => `MBR****${d.slice(-2)}`);
  return out;
}

export function maskMemberId(memberId: string): string {
  if (memberId.length <= 4) return '****';
  return `${memberId.slice(0, 3)}****${memberId.slice(-2)}`;
}

export type AuditEntry = {
  ts: string;
  type: 'USER' | 'AGENT' | 'TOOL' | 'GUARDRAIL' | 'ESCALATION';
  detail: string;
};

export function audit(entries: AuditEntry[], type: AuditEntry['type'], detail: string): void {
  entries.push({ ts: new Date().toISOString(), type, detail: redactForLog(detail) });
}
