/**
 * Deterministic tools — the ONLY way the agent gets facts.
 *
 * Every tool reads from mockTpa.ts in the MVP. In production, replace the
 * body of each tool with a call to your TPA API / claims admin system.
 * The tool *signature* and *return shape* stay the same, so the agent
 * logic does not change when you go live.
 */
import { CLAIMS, PROVIDERS, PRIOR_AUTHS, claimsFor, authsFor, findMember, findPlan, type Member, type Plan } from '../data/mockTpa.js';

export type ToolResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
  tool: string;
};

export function verifyMember(memberId: string): ToolResult<Member> {
  const member = findMember(memberId);
  if (!member) return { ok: false, tool: 'verifyMember', error: 'MEMBER_NOT_FOUND' };
  return { ok: true, tool: 'verifyMember', data: member };
}

export function verifyDob(member: Member, dobInput: string): boolean {
  const normalized = normalizeDob(dobInput);
  return normalized === member.dob;
}

export function verifyZip(member: Member, zipInput: string): boolean {
  const digits = zipInput.replace(/\D/g, '').slice(0, 5);
  return digits === member.zip;
}

/** Accept YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, "March 14 1985", "14 March 1985", "3/14/1985". */
export function normalizeDob(input: string): string | null {
  const s = input.trim();
  // ISO
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  // Month name forms
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06', julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  };
  const m1 = s.toLowerCase().match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m1 && months[m1[1]]) return `${m1[3]}-${months[m1[1]]}-${m1[2].padStart(2, '0')}`;
  const m2 = s.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
  if (m2 && months[m2[2]]) return `${m2[3]}-${months[m2[2]]}-${m2[1].padStart(2, '0')}`;
  return null;
}

export function getClaimStatus(memberId: string, claimId?: string): ToolResult {
  const claims = claimsFor(memberId);
  if (claimId) {
    const c = claims.find((x) => x.claimId.toUpperCase() === claimId.toUpperCase());
    if (!c) return { ok: false, tool: 'getClaimStatus', error: 'CLAIM_NOT_FOUND' };
    return { ok: true, tool: 'getClaimStatus', data: c };
  }
  return { ok: true, tool: 'getClaimStatus', data: claims };
}

export function getEligibility(memberId: string): ToolResult<{ member: Member; plan: Plan | undefined }> {
  const member = findMember(memberId);
  if (!member) return { ok: false, tool: 'getEligibility', error: 'MEMBER_NOT_FOUND' };
  return { ok: true, tool: 'getEligibility', data: { member, plan: findPlan(member.planId) } };
}

export function getBenefits(memberId: string): ToolResult {
  const member = findMember(memberId);
  if (!member) return { ok: false, tool: 'getBenefits', error: 'MEMBER_NOT_FOUND' };
  const plan = findPlan(member.planId);
  if (!plan) return { ok: false, tool: 'getBenefits', error: 'PLAN_NOT_FOUND' };
  const remainingDeductible = Math.max(0, plan.deductibleIndividual - member.deductibleMetIndividual);
  const remainingOop = Math.max(0, plan.outOfPocketMaxIndividual - member.oopMetIndividual);
  return {
    ok: true, tool: 'getBenefits',
    data: {
      member: { firstName: member.firstName, lastName: member.lastName, planId: member.planId },
      plan,
      deductibleMetIndividual: member.deductibleMetIndividual,
      deductibleRemainingIndividual: remainingDeductible,
      oopMetIndividual: member.oopMetIndividual,
      oopRemainingIndividual: remainingOop,
    },
  };
}

export function requestIdCard(memberId: string): ToolResult<{ memberId: string; action: string; eta: string }> {
  const member = findMember(memberId);
  if (!member) return { ok: false, tool: 'requestIdCard', error: 'MEMBER_NOT_FOUND' };
  return { ok: true, tool: 'requestIdCard', data: { memberId, action: 'ID_CARD_REISSUE_REQUESTED', eta: '7-10 business days by mail, digital card available immediately' } };
}

export function findProvider(specialty?: string, zip?: string): ToolResult {
  let list = [...PROVIDERS];
  if (specialty) {
    const q = specialty.toLowerCase();
    list = list.filter((p) => p.specialty.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
  }
  // Sort: in-network first, then distance
  list.sort((a, b) => Number(b.inNetwork) - Number(a.inNetwork) || a.distanceMiles - b.distanceMiles);
  return { ok: true, tool: 'findProvider', data: list.slice(0, 3) };
}

export function getPriorAuthStatus(memberId: string, authId?: string): ToolResult {
  const auths = authsFor(memberId);
  if (authId) {
    const a = auths.find((x) => x.authId.toUpperCase() === authId.toUpperCase());
    if (!a) return { ok: false, tool: 'getPriorAuthStatus', error: 'AUTH_NOT_FOUND' };
    return { ok: true, tool: 'getPriorAuthStatus', data: a };
  }
  return { ok: true, tool: 'getPriorAuthStatus', data: auths };
}

export type Escalation = {
  reason: string;
  memberId?: string;
  intent?: string;
  summary: string;
  createdAt: string;
};

export function createEscalation(reason: string, memberId: string | undefined, intent: string | undefined, summary: string): Escalation {
  return { reason, memberId, intent, summary, createdAt: new Date().toISOString() };
}

// Re-export for tests that need raw claims
export { CLAIMS, PRIOR_AUTHS };
