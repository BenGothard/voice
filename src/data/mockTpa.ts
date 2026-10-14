/**
 * Mock TPA data — realistic, deterministic, safe for demos.
 *
 * In production, replace these lookups with calls to your claims admin
 * system (HealthEdge, QicLink, etc.) via a secure API gateway.
 * NEVER hardcode dollar amounts, dates, or statuses in prompts — every
 * amount in an agent reply must come from a tool that read this data.
 */

export type Plan = {
  id: string;
  name: string;
  planYear: number;
  deductibleIndividual: number;
  deductibleFamily: number;
  outOfPocketMaxIndividual: number;
  outOfPocketMaxFamily: number;
  copayPrimary: number;
  copaySpecialist: number;
  copayUrgentCare: number;
  copayEr: number;
};

export type Member = {
  memberId: string; // e.g. MBR1001 — used for demo login
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  zip: string;
  language: 'en' | 'es';
  planId: string;
  ssnLast4: string;
  phone: string;
  email: string;
  deductibleMetIndividual: number;
  deductibleMetFamily: number;
  oopMetIndividual: number;
  oopMetFamily: number;
  eligible: boolean;
  eligibilityNote: string;
};

export type Claim = {
  claimId: string;
  memberId: string;
  dateOfService: string;
  provider: string;
  service: string;
  amountBilled: number;
  amountPaid: number;
  patientResponsibility: number;
  status: 'approved' | 'pending' | 'denied';
  denialReason?: string;
  eobSent: boolean;
  paidDate?: string;
};

export type Provider = {
  id: string;
  name: string;
  specialty: string;
  address: string;
  city: string;
  zip: string;
  phone: string;
  inNetwork: boolean;
  distanceMiles: number;
  acceptingNew: boolean;
};

export type PriorAuth = {
  authId: string;
  memberId: string;
  service: string;
  status: 'approved' | 'pending' | 'denied';
  requestedDate: string;
  decisionDate?: string;
  notes: string;
};

export const PLANS: Plan[] = [
  {
    id: 'PPO-GOLD',
    name: 'PPO Gold',
    planYear: 2026,
    deductibleIndividual: 1000,
    deductibleFamily: 2000,
    outOfPocketMaxIndividual: 5000,
    outOfPocketMaxFamily: 10000,
    copayPrimary: 25,
    copaySpecialist: 50,
    copayUrgentCare: 75,
    copayEr: 250,
  },
  {
    id: 'HMO-SILVER',
    name: 'HMO Silver',
    planYear: 2026,
    deductibleIndividual: 1500,
    deductibleFamily: 3000,
    outOfPocketMaxIndividual: 6500,
    outOfPocketMaxFamily: 13000,
    copayPrimary: 30,
    copaySpecialist: 60,
    copayUrgentCare: 90,
    copayEr: 300,
  },
  {
    id: 'HDHP-BRONZE',
    name: 'HDHP Bronze',
    planYear: 2026,
    deductibleIndividual: 3500,
    deductibleFamily: 7000,
    outOfPocketMaxIndividual: 7500,
    outOfPocketMaxFamily: 15000,
    copayPrimary: 0,
    copaySpecialist: 0,
    copayUrgentCare: 0,
    copayEr: 0,
  },
  {
    id: 'PPO-PLAT',
    name: 'PPO Platinum',
    planYear: 2026,
    deductibleIndividual: 500,
    deductibleFamily: 1000,
    outOfPocketMaxIndividual: 3000,
    outOfPocketMaxFamily: 6000,
    copayPrimary: 15,
    copaySpecialist: 30,
    copayUrgentCare: 50,
    copayEr: 200,
  },
];

export const MEMBERS: Member[] = [
  {
    memberId: 'MBR1001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    dob: '1985-03-14',
    zip: '85004',
    language: 'en',
    planId: 'PPO-GOLD',
    ssnLast4: '1234',
    phone: '(602) 555-0101',
    email: 'sarah.j@example.com',
    deductibleMetIndividual: 650,
    deductibleMetFamily: 1100,
    oopMetIndividual: 1200,
    oopMetFamily: 2100,
    eligible: true,
    eligibilityNote: 'Active coverage through Dec 31, 2026.',
  },
  {
    memberId: 'MBR1002',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    dob: '1978-11-02',
    zip: '85016',
    language: 'es',
    planId: 'HMO-SILVER',
    ssnLast4: '5678',
    phone: '(602) 555-0102',
    email: 'carlos.m@example.com',
    deductibleMetIndividual: 1200,
    deductibleMetFamily: 2400,
    oopMetIndividual: 2100,
    oopMetFamily: 3900,
    eligible: true,
    eligibilityNote: 'Active coverage through Dec 31, 2026. PCP required for referrals.',
  },
  {
    memberId: 'MBR1003',
    firstName: 'Emily',
    lastName: 'Chen',
    dob: '1992-07-21',
    zip: '85281',
    language: 'en',
    planId: 'HDHP-BRONZE',
    ssnLast4: '9012',
    phone: '(480) 555-0103',
    email: 'emily.c@example.com',
    deductibleMetIndividual: 800,
    deductibleMetFamily: 800,
    oopMetIndividual: 950,
    oopMetFamily: 950,
    eligible: true,
    eligibilityNote: 'Active coverage. High-deductible plan — deductible applies before most services.',
  },
  {
    memberId: 'MBR1004',
    firstName: 'James',
    lastName: 'Wilson',
    dob: '1965-01-30',
    zip: '85008',
    language: 'en',
    planId: 'PPO-GOLD',
    ssnLast4: '3456',
    phone: '(602) 555-0104',
    email: 'james.w@example.com',
    deductibleMetIndividual: 1000,
    deductibleMetFamily: 2000,
    oopMetIndividual: 4800,
    oopMetFamily: 8200,
    eligible: true,
    eligibilityNote: 'Active coverage. Deductible fully met for the year.',
  },
  {
    memberId: 'MBR1005',
    firstName: 'Maria',
    lastName: 'Garcia',
    dob: '1980-05-19',
    zip: '85009',
    language: 'es',
    planId: 'HMO-SILVER',
    ssnLast4: '7890',
    phone: '(602) 555-0105',
    email: 'maria.g@example.com',
    deductibleMetIndividual: 300,
    deductibleMetFamily: 900,
    oopMetIndividual: 700,
    oopMetFamily: 1500,
    eligible: true,
    eligibilityNote: 'Active coverage through Dec 31, 2026.',
  },
  {
    memberId: 'MBR1006',
    firstName: 'David',
    lastName: 'Kim',
    dob: '1990-09-12',
    zip: '85255',
    language: 'en',
    planId: 'HDHP-BRONZE',
    ssnLast4: '2345',
    phone: '(480) 555-0106',
    email: 'david.k@example.com',
    deductibleMetIndividual: 0,
    deductibleMetFamily: 0,
    oopMetIndividual: 0,
    oopMetFamily: 0,
    eligible: false,
    eligibilityNote: 'Coverage ended Sep 30, 2026. Not currently eligible.',
  },
  {
    memberId: 'MBR1007',
    firstName: 'Aisha',
    lastName: 'Patel',
    dob: '1975-12-05',
    zip: '85012',
    language: 'en',
    planId: 'PPO-PLAT',
    ssnLast4: '6789',
    phone: '(602) 555-0107',
    email: 'aisha.p@example.com',
    deductibleMetIndividual: 500,
    deductibleMetFamily: 500,
    oopMetIndividual: 900,
    oopMetFamily: 900,
    eligible: true,
    eligibilityNote: 'Active coverage. Deductible fully met for the year.',
  },
  {
    memberId: 'MBR1008',
    firstName: 'Robert',
    lastName: 'Taylor',
    dob: '1958-08-23',
    zip: '85020',
    language: 'en',
    planId: 'HMO-SILVER',
    ssnLast4: '0123',
    phone: '(602) 555-0108',
    email: 'robert.t@example.com',
    deductibleMetIndividual: 1500,
    deductibleMetFamily: 2900,
    oopMetIndividual: 6200,
    oopMetFamily: 11000,
    eligible: true,
    eligibilityNote: 'Active coverage. Out-of-pocket maximum nearly met.',
  },
];

export const CLAIMS: Claim[] = [
  { claimId: 'CLM-9001', memberId: 'MBR1001', dateOfService: '2026-03-12', provider: 'Desert Valley Medical', service: 'Office visit - Primary care', amountBilled: 450, amountPaid: 320, patientResponsibility: 25, status: 'approved', eobSent: true, paidDate: '2026-03-20' },
  { claimId: 'CLM-9002', memberId: 'MBR1001', dateOfService: '2026-04-02', provider: 'Sonoran Imaging', service: 'MRI - Knee', amountBilled: 1850, amountPaid: 1200, patientResponsibility: 350, status: 'approved', eobSent: true, paidDate: '2026-04-15' },
  { claimId: 'CLM-9003', memberId: 'MBR1001', dateOfService: '2026-05-18', provider: 'Valley Physical Therapy', service: 'Physical therapy - 6 visits', amountBilled: 900, amountPaid: 0, patientResponsibility: 0, status: 'pending', eobSent: false },
  { claimId: 'CLM-9101', memberId: 'MBR1002', dateOfService: '2026-02-10', provider: 'Phoenix Family Health', service: 'Annual wellness exam', amountBilled: 300, amountPaid: 300, patientResponsibility: 0, status: 'approved', eobSent: true, paidDate: '2026-02-22' },
  { claimId: 'CLM-9102', memberId: 'MBR1002', dateOfService: '2026-04-28', provider: 'Desert Cardiology', service: 'Cardiology consult', amountBilled: 650, amountPaid: 0, patientResponsibility: 0, status: 'denied', denialReason: 'Prior authorization required and not obtained.', eobSent: true },
  { claimId: 'CLM-9201', memberId: 'MBR1003', dateOfService: '2026-03-05', provider: 'Tempe Urgent Care', service: 'Urgent care visit', amountBilled: 280, amountPaid: 0, patientResponsibility: 280, status: 'approved', eobSent: true, paidDate: '2026-03-14' },
  { claimId: 'CLM-9202', memberId: 'MBR1003', dateOfService: '2026-05-01', provider: 'Banner Lab Services', service: 'Lab panel - Blood work', amountBilled: 420, amountPaid: 150, patientResponsibility: 270, status: 'approved', eobSent: true, paidDate: '2026-05-10' },
  { claimId: 'CLM-9301', memberId: 'MBR1004', dateOfService: '2026-01-15', provider: 'Mayo Clinic Arizona', service: 'Specialist - Orthopedics', amountBilled: 1200, amountPaid: 1100, patientResponsibility: 50, status: 'approved', eobSent: true, paidDate: '2026-01-28' },
  { claimId: 'CLM-9302', memberId: 'MBR1004', dateOfService: '2026-04-20', provider: 'Desert Valley Medical', service: 'Office visit - Follow-up', amountBilled: 200, amountPaid: 150, patientResponsibility: 25, status: 'approved', eobSent: true, paidDate: '2026-05-02' },
  { claimId: 'CLM-9401', memberId: 'MBR1005', dateOfService: '2026-03-22', provider: 'South Mountain Pediatrics', service: 'Well-child visit', amountBilled: 350, amountPaid: 350, patientResponsibility: 0, status: 'approved', eobSent: true, paidDate: '2026-04-01' },
  { claimId: 'CLM-9402', memberId: 'MBR1005', dateOfService: '2026-05-11', provider: 'Valley Physical Therapy', service: 'Physical therapy - 4 visits', amountBilled: 600, amountPaid: 0, patientResponsibility: 0, status: 'pending', eobSent: false },
  { claimId: 'CLM-9501', memberId: 'MBR1006', dateOfService: '2026-05-30', provider: 'Scottsdale Dermatology', service: 'Dermatology consult', amountBilled: 400, amountPaid: 0, patientResponsibility: 0, status: 'denied', denialReason: 'Member not eligible on date of service.', eobSent: true },
  { claimId: 'CLM-9601', memberId: 'MBR1007', dateOfService: '2026-02-18', provider: 'Paradise Valley Hospital', service: 'Outpatient surgery', amountBilled: 8400, amountPaid: 7900, patientResponsibility: 200, status: 'approved', eobSent: true, paidDate: '2026-03-05' },
  { claimId: 'CLM-9602', memberId: 'MBR1007', dateOfService: '2026-04-09', provider: 'Desert Valley Medical', service: 'Office visit - Primary care', amountBilled: 180, amountPaid: 165, patientResponsibility: 15, status: 'approved', eobSent: true, paidDate: '2026-04-18' },
  { claimId: 'CLM-9701', memberId: 'MBR1008', dateOfService: '2026-03-30', provider: 'Out-of-Network Imaging Center', service: 'CT scan', amountBilled: 2200, amountPaid: 0, patientResponsibility: 0, status: 'denied', denialReason: 'Out-of-network provider. No out-of-network benefit for this service.', eobSent: true },
];

export const PROVIDERS: Provider[] = [
  { id: 'PRV-01', name: 'Desert Valley Medical', specialty: 'Primary Care', address: '1234 E Camelback Rd', city: 'Phoenix', zip: '85014', phone: '(602) 555-2001', inNetwork: true, distanceMiles: 2.1, acceptingNew: true },
  { id: 'PRV-02', name: 'Phoenix Family Health', specialty: 'Primary Care', address: '5678 N 7th St', city: 'Phoenix', zip: '85014', phone: '(602) 555-2002', inNetwork: true, distanceMiles: 3.4, acceptingNew: true },
  { id: 'PRV-03', name: 'Sonoran Imaging', specialty: 'Radiology', address: '9101 E Thomas Rd', city: 'Scottsdale', zip: '85257', phone: '(480) 555-2003', inNetwork: true, distanceMiles: 5.8, acceptingNew: true },
  { id: 'PRV-04', name: 'Valley Physical Therapy', specialty: 'Physical Therapy', address: '222 W McDowell Rd', city: 'Phoenix', zip: '85004', phone: '(602) 555-2004', inNetwork: true, distanceMiles: 1.2, acceptingNew: true },
  { id: 'PRV-05', name: 'Desert Cardiology', specialty: 'Cardiology', address: '4455 N 32nd St', city: 'Phoenix', zip: '85018', phone: '(602) 555-2005', inNetwork: true, distanceMiles: 4.0, acceptingNew: false },
  { id: 'PRV-06', name: 'Tempe Urgent Care', specialty: 'Urgent Care', address: '789 S Mill Ave', city: 'Tempe', zip: '85281', phone: '(480) 555-2006', inNetwork: true, distanceMiles: 2.8, acceptingNew: true },
  { id: 'PRV-07', name: 'Out-of-Network Imaging Center', specialty: 'Radiology', address: '999 E Outlier Way', city: 'Glendale', zip: '85301', phone: '(623) 555-2007', inNetwork: false, distanceMiles: 12.5, acceptingNew: true },
  { id: 'PRV-08', name: 'Banner Lab Services', specialty: 'Laboratory', address: '321 N Central Ave', city: 'Phoenix', zip: '85004', phone: '(602) 555-2008', inNetwork: true, distanceMiles: 1.5, acceptingNew: true },
];

export const PRIOR_AUTHS: PriorAuth[] = [
  { authId: 'PA-5001', memberId: 'MBR1001', service: 'MRI - Knee', status: 'approved', requestedDate: '2026-03-01', decisionDate: '2026-03-03', notes: 'Approved for 1 MRI.' },
  { authId: 'PA-5002', memberId: 'MBR1001', service: 'Physical therapy - 12 visits', status: 'pending', requestedDate: '2026-05-15', notes: 'Under clinical review. Decision expected within 5 business days.' },
  { authId: 'PA-5101', memberId: 'MBR1002', service: 'Cardiology consult', status: 'denied', requestedDate: '2026-04-10', decisionDate: '2026-04-12', notes: 'Denied — prior authorization was not obtained before service. Appeal rights apply.' },
  { authId: 'PA-5201', memberId: 'MBR1003', service: 'Lab panel - Blood work', status: 'approved', requestedDate: '2026-04-25', decisionDate: '2026-04-26', notes: 'Approved.' },
  { authId: 'PA-5301', memberId: 'MBR1007', service: 'Outpatient surgery', status: 'approved', requestedDate: '2026-02-10', decisionDate: '2026-02-12', notes: 'Approved.' },
  { authId: 'PA-5401', memberId: 'MBR1008', service: 'CT scan', status: 'denied', requestedDate: '2026-03-20', decisionDate: '2026-03-22', notes: 'Denied — out-of-network provider.' },
];

// Helpers for tools.ts — keep lookups in one place.
export function findMember(memberId: string): Member | undefined {
  const normalized = memberId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return MEMBERS.find((m) => m.memberId === normalized);
}
export function findPlan(planId: string): Plan | undefined {
  return PLANS.find((p) => p.id === planId);
}
export function claimsFor(memberId: string): Claim[] {
  return CLAIMS.filter((c) => c.memberId === memberId).sort((a, b) => b.dateOfService.localeCompare(a.dateOfService));
}
export function authsFor(memberId: string): PriorAuth[] {
  return PRIOR_AUTHS.filter((a) => a.memberId === memberId);
}
