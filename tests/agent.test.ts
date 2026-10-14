import { describe, it, expect } from 'vitest';
import { createSession, handleMessage, detectIntent } from '../src/agent/engine.js';
import { verifyMember, getClaimStatus, getBenefits, getEligibility, findProvider, getPriorAuthStatus } from '../src/agent/tools.js';
import { detectEscalation, redactForLog, canDisclosePhi } from '../src/agent/guardrails.js';
import { toNato } from '../src/agent/prompts.js';

describe('verification', () => {
  it('requires verification before PHI', () => {
    const s = createSession('t1');
    const r = handleMessage(s, 'claims status');
    // First turn is greeting -> asks for ID, no PHI
    expect(r.reply).toMatch(/member ID/i);
    expect(r.verified).toBe(false);
  });
  it('verifies happy path', () => {
    const s = createSession('t2');
    handleMessage(s, 'hello');
    let r = handleMessage(s, 'MBR1001');
    expect(r.state).toBe('VERIFY_DOB');
    r = handleMessage(s, '1985-03-14');
    expect(r.state).toBe('VERIFY_ZIP');
    r = handleMessage(s, '85004');
    expect(r.verified).toBe(true);
    expect(r.state).toBe('AUTHENTICATED');
  });
  it('rejects wrong DOB', () => {
    const s = createSession('t3');
    handleMessage(s, 'hello');
    handleMessage(s, 'MBR1001');
    const r = handleMessage(s, '1990-01-01');
    expect(r.verified).toBe(false);
    expect(r.state).toBe('VERIFY_DOB');
  });
  it('escalates after 3 failed ID attempts', () => {
    const s = createSession('t4');
    handleMessage(s, 'hello');
    handleMessage(s, 'MBR9999');
    handleMessage(s, 'MBR9998');
    const r = handleMessage(s, 'MBR9997');
    expect(r.state).toBe('ESCALATE');
    expect(r.escalation?.reason).toBe('VERIFICATION_FAILED');
  });
});

describe('tools determinism', () => {
  it('verifyMember finds known member', () => {
    expect(verifyMember('MBR1001').ok).toBe(true);
    expect(verifyMember('MBR9999').ok).toBe(false);
  });
  it('claims come from data, not prompt', () => {
    const res = getClaimStatus('MBR1001');
    expect(res.ok).toBe(true);
    const claims = res.data as unknown[];
    expect(claims.length).toBe(3);
  });
  it('benefits math is deterministic', () => {
    const res = getBenefits('MBR1001');
    expect(res.ok).toBe(true);
    const d = res.data as { deductibleMetIndividual: number; deductibleRemainingIndividual: number };
    expect(d.deductibleMetIndividual).toBe(650);
    expect(d.deductibleRemainingIndividual).toBe(350); // 1000 - 650
  });
  it('eligibility reflects ineligible member', () => {
    const res = getEligibility('MBR1006');
    const data = res.data as { member: { eligible: boolean } };
    expect(data.member.eligible).toBe(false);
  });
  it('provider lookup prefers in-network', () => {
    const res = findProvider('Radiology');
    const list = res.data as { inNetwork: boolean }[];
    expect(list[0].inNetwork).toBe(true);
  });
  it('prior auth returns correct status', () => {
    const res = getPriorAuthStatus('MBR1002', 'PA-5101');
    const a = res.data as { status: string };
    expect(a.status).toBe('denied');
  });
});

describe('guardrails', () => {
  it('detects appeal -> escalation', () => {
    expect(detectEscalation('I want to appeal this denial')).toBe('APPEAL_OR_GRIEVANCE');
  });
  it('detects medical emergency', () => {
    expect(detectEscalation('I have chest pain')).toBe('MEDICAL_EMERGENCY');
  });
  it('detects supervisor request', () => {
    expect(detectEscalation('let me talk to a supervisor')).toBe('REQUEST_SUPERVISOR');
  });
  it('redacts DOB and SSN in logs', () => {
    const out = redactForLog('DOB 1985-03-14 SSN 123-45-6789 member MBR1001');
    expect(out).not.toContain('1985-03-14');
    expect(out).not.toContain('123-45-6789');
  });
  it('PHI gate blocks pre-auth states', () => {
    expect(canDisclosePhi('VERIFY_ID')).toBe(false);
    expect(canDisclosePhi('AUTHENTICATED')).toBe(true);
  });
  it('NATO phonetic', () => {
    expect(toNato('MBR1001')).toBe('Mike Bravo Romeo 1 0 0 1');
  });
});

describe('intents', () => {
  it('detects intents', () => {
    expect(detectIntent('what is my claims status?')).toBe('claims_status');
    expect(detectIntent('am I eligible?')).toBe('eligibility');
    expect(detectIntent('how much deductible left?')).toBe('benefits_deductible');
    expect(detectIntent('I need a new ID card')).toBe('id_card');
    expect(detectIntent('find a cardiologist')).toBe('provider_lookup');
    expect(detectIntent('prior auth status')).toBe('prior_auth_status');
  });
});

describe('end-to-end claims flow', () => {
  it('verified claims flow returns dollar amounts from tools', () => {
    const s = createSession('e2e1');
    handleMessage(s, 'hello');
    handleMessage(s, 'MBR1001');
    handleMessage(s, '1985-03-14');
    handleMessage(s, '85004');
    const r = handleMessage(s, 'claims status');
    expect(r.verified).toBe(true);
    expect(r.reply).toMatch(/CLM-9003/); // most recent claim
    expect(r.toolCalls.some((t) => t.tool === 'getClaimStatus')).toBe(true);
  });
  it('appeal escalates after verification', () => {
    const s = createSession('e2e2');
    handleMessage(s, 'hello');
    handleMessage(s, 'MBR1002');
    handleMessage(s, '1978-11-02');
    handleMessage(s, '85016');
    const r = handleMessage(s, 'I want to appeal this denial');
    expect(r.state).toBe('ESCALATE');
  });
  it('no PHI before auth — claims request before verification does not leak', () => {
    const s = createSession('e2e3');
    handleMessage(s, 'hello');
    const r = handleMessage(s, 'what is my claim CLM-9001 status?');
    expect(r.reply).not.toMatch(/\$450/);
    expect(r.reply).not.toMatch(/CLM-9001.*approved/);
  });
});
