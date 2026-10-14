"use strict";
var TPAAgent = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/browser/entry.ts
  var entry_exports = {};
  __export(entry_exports, {
    createSession: () => createSession,
    escalateSession: () => escalateSession,
    getSummary: () => getSummary,
    handleMessage: () => handleMessage
  });

  // src/agent/prompts.ts
  var NATO = {
    A: "Alpha",
    B: "Bravo",
    C: "Charlie",
    D: "Delta",
    E: "Echo",
    F: "Foxtrot",
    G: "Golf",
    H: "Hotel",
    I: "India",
    J: "Juliet",
    K: "Kilo",
    L: "Lima",
    M: "Mike",
    N: "November",
    O: "Oscar",
    P: "Papa",
    Q: "Quebec",
    R: "Romeo",
    S: "Sierra",
    T: "Tango",
    U: "Uniform",
    V: "Victor",
    W: "Whiskey",
    X: "X-ray",
    Y: "Yankee",
    Z: "Zulu"
  };
  function toNato(input) {
    return input.toUpperCase().split("").map((ch) => {
      if (/[A-Z]/.test(ch)) return NATO[ch] ?? ch;
      if (/[0-9]/.test(ch)) return ch;
      return "";
    }).filter(Boolean).join(" ");
  }
  var STRINGS = {
    en: {
      greeting: "Hello, this is your benefits support agent. I can help with claims, eligibility, benefits, ID cards, providers, and prior auth. To protect your privacy, I'll verify your identity first. What's your member ID?",
      askDob: "Thanks. For security, what is your date of birth? You can say it like March 14, 1985.",
      askZip: "Thanks. What is your ZIP code?",
      verified: "Thank you, you are verified. How can I help today \u2014 claims status, eligibility, benefits, ID card, provider lookup, or prior auth?",
      notFoundId: "I didn't find that member ID. Could you repeat it slowly? For example, Mike Bravo Romeo 1 0 0 1.",
      wrongDob: "That date of birth doesn't match what we have. Could you try again?",
      wrongZip: "That ZIP code doesn't match what we have. Could you try again?",
      needVerification: "Before I can share any claim or benefits details, I need to verify your identity. What's your member ID?",
      askIntent: "How can I help \u2014 claims status, eligibility, benefits, ID card, provider lookup, or prior auth?",
      followUp: "Is there anything else I can help with today?",
      goodbye: "Thank you for calling. Take care, and have a great day.",
      escalateOffer: "Would you like me to connect you to a representative?",
      escalated: "I am connecting you to a representative now. They will have your information and the summary of our conversation, so you will not need to repeat yourself.",
      emergency: "If this is a medical emergency, please hang up and call 911 or seek emergency care right away. I can also connect you to a representative.",
      cantHelp: "I want to make sure you get the right help, so I'm going to connect you to a representative who can help with that.",
      noRecord: "I don't see a record for that. I won't guess \u2014 would you like me to connect you to a representative who can look into it?",
      didNotUnderstand: "I didn't catch that. Could you repeat it? You can say things like 'claims status', 'eligibility', 'benefits', 'ID card', 'find a provider', or 'prior auth'.",
      idConfirm: "Just to confirm, that is",
      transferNote: "Transferring to a human agent."
    },
    es: {
      greeting: "Hola, soy su agente de apoyo de beneficios. Puedo ayudar con reclamos, elegibilidad, beneficios, tarjeta de identificaci\xF3n, proveedores y autorizaci\xF3n previa. Para proteger su privacidad, primero verificar\xE9 su identidad. \xBFCu\xE1l es su n\xFAmero de miembro?",
      askDob: "Gracias. Por seguridad, \xBFcu\xE1l es su fecha de nacimiento? Puede decirla como 14 de marzo de 1985.",
      askZip: "Gracias. \xBFCu\xE1l es su c\xF3digo postal?",
      verified: "Gracias, su identidad est\xE1 verificada. \xBFC\xF3mo puedo ayudar hoy \u2014 estado de reclamos, elegibilidad, beneficios, tarjeta, b\xFAsqueda de proveedor o autorizaci\xF3n previa?",
      notFoundId: "No encontr\xE9 ese n\xFAmero de miembro. \xBFPodr\xEDa repetirlo despacio? Por ejemplo, Mike Bravo Romeo 1 0 0 1.",
      wrongDob: "Esa fecha de nacimiento no coincide con nuestros registros. \xBFPodr\xEDa intentarlo de nuevo?",
      wrongZip: "Ese c\xF3digo postal no coincide con nuestros registros. \xBFPodr\xEDa intentarlo de nuevo?",
      needVerification: "Antes de compartir detalles de reclamos o beneficios, necesito verificar su identidad. \xBFCu\xE1l es su n\xFAmero de miembro?",
      askIntent: "\xBFC\xF3mo puedo ayudar \u2014 estado de reclamos, elegibilidad, beneficios, tarjeta, b\xFAsqueda de proveedor o autorizaci\xF3n previa?",
      followUp: "\xBFHay algo m\xE1s en lo que pueda ayudar hoy?",
      goodbye: "Gracias por llamar. Cu\xEDdese y que tenga un buen d\xEDa.",
      escalateOffer: "\xBFDesea que lo conecte con un representante?",
      escalated: "Lo estoy conectando con un representante ahora. Tendr\xE1 su informaci\xF3n y el resumen de nuestra conversaci\xF3n, as\xED que no necesitar\xE1 repetirla.",
      emergency: "Si es una emergencia m\xE9dica, cuelgue y llame al 911 o busque atenci\xF3n de emergencia de inmediato. Tambi\xE9n puedo conectarlo con un representante.",
      cantHelp: "Quiero asegurarme de que reciba la ayuda correcta, as\xED que lo conectar\xE9 con un representante que pueda ayudarle con eso.",
      noRecord: "No veo un registro para eso. No voy a adivinar \u2014 \xBFdesea que lo conecte con un representante que pueda investigarlo?",
      didNotUnderstand: 'No entend\xED eso. \xBFPodr\xEDa repetirlo? Puede decir cosas como "estado de reclamos", "elegibilidad", "beneficios", "tarjeta", "buscar proveedor" o "autorizaci\xF3n previa".',
      idConfirm: "Solo para confirmar, eso es",
      transferNote: "Transfiriendo a un agente humano."
    }
  };
  function t(lang, key) {
    return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
  }

  // src/data/mockTpa.ts
  var PLANS = [
    {
      id: "PPO-GOLD",
      name: "PPO Gold",
      planYear: 2026,
      deductibleIndividual: 1e3,
      deductibleFamily: 2e3,
      outOfPocketMaxIndividual: 5e3,
      outOfPocketMaxFamily: 1e4,
      copayPrimary: 25,
      copaySpecialist: 50,
      copayUrgentCare: 75,
      copayEr: 250
    },
    {
      id: "HMO-SILVER",
      name: "HMO Silver",
      planYear: 2026,
      deductibleIndividual: 1500,
      deductibleFamily: 3e3,
      outOfPocketMaxIndividual: 6500,
      outOfPocketMaxFamily: 13e3,
      copayPrimary: 30,
      copaySpecialist: 60,
      copayUrgentCare: 90,
      copayEr: 300
    },
    {
      id: "HDHP-BRONZE",
      name: "HDHP Bronze",
      planYear: 2026,
      deductibleIndividual: 3500,
      deductibleFamily: 7e3,
      outOfPocketMaxIndividual: 7500,
      outOfPocketMaxFamily: 15e3,
      copayPrimary: 0,
      copaySpecialist: 0,
      copayUrgentCare: 0,
      copayEr: 0
    },
    {
      id: "PPO-PLAT",
      name: "PPO Platinum",
      planYear: 2026,
      deductibleIndividual: 500,
      deductibleFamily: 1e3,
      outOfPocketMaxIndividual: 3e3,
      outOfPocketMaxFamily: 6e3,
      copayPrimary: 15,
      copaySpecialist: 30,
      copayUrgentCare: 50,
      copayEr: 200
    }
  ];
  var MEMBERS = [
    {
      memberId: "MBR1001",
      firstName: "Sarah",
      lastName: "Johnson",
      dob: "1985-03-14",
      zip: "85004",
      language: "en",
      planId: "PPO-GOLD",
      ssnLast4: "1234",
      phone: "(602) 555-0101",
      email: "sarah.j@example.com",
      deductibleMetIndividual: 650,
      deductibleMetFamily: 1100,
      oopMetIndividual: 1200,
      oopMetFamily: 2100,
      eligible: true,
      eligibilityNote: "Active coverage through Dec 31, 2026."
    },
    {
      memberId: "MBR1002",
      firstName: "Carlos",
      lastName: "Mendoza",
      dob: "1978-11-02",
      zip: "85016",
      language: "es",
      planId: "HMO-SILVER",
      ssnLast4: "5678",
      phone: "(602) 555-0102",
      email: "carlos.m@example.com",
      deductibleMetIndividual: 1200,
      deductibleMetFamily: 2400,
      oopMetIndividual: 2100,
      oopMetFamily: 3900,
      eligible: true,
      eligibilityNote: "Active coverage through Dec 31, 2026. PCP required for referrals."
    },
    {
      memberId: "MBR1003",
      firstName: "Emily",
      lastName: "Chen",
      dob: "1992-07-21",
      zip: "85281",
      language: "en",
      planId: "HDHP-BRONZE",
      ssnLast4: "9012",
      phone: "(480) 555-0103",
      email: "emily.c@example.com",
      deductibleMetIndividual: 800,
      deductibleMetFamily: 800,
      oopMetIndividual: 950,
      oopMetFamily: 950,
      eligible: true,
      eligibilityNote: "Active coverage. High-deductible plan \u2014 deductible applies before most services."
    },
    {
      memberId: "MBR1004",
      firstName: "James",
      lastName: "Wilson",
      dob: "1965-01-30",
      zip: "85008",
      language: "en",
      planId: "PPO-GOLD",
      ssnLast4: "3456",
      phone: "(602) 555-0104",
      email: "james.w@example.com",
      deductibleMetIndividual: 1e3,
      deductibleMetFamily: 2e3,
      oopMetIndividual: 4800,
      oopMetFamily: 8200,
      eligible: true,
      eligibilityNote: "Active coverage. Deductible fully met for the year."
    },
    {
      memberId: "MBR1005",
      firstName: "Maria",
      lastName: "Garcia",
      dob: "1980-05-19",
      zip: "85009",
      language: "es",
      planId: "HMO-SILVER",
      ssnLast4: "7890",
      phone: "(602) 555-0105",
      email: "maria.g@example.com",
      deductibleMetIndividual: 300,
      deductibleMetFamily: 900,
      oopMetIndividual: 700,
      oopMetFamily: 1500,
      eligible: true,
      eligibilityNote: "Active coverage through Dec 31, 2026."
    },
    {
      memberId: "MBR1006",
      firstName: "David",
      lastName: "Kim",
      dob: "1990-09-12",
      zip: "85255",
      language: "en",
      planId: "HDHP-BRONZE",
      ssnLast4: "2345",
      phone: "(480) 555-0106",
      email: "david.k@example.com",
      deductibleMetIndividual: 0,
      deductibleMetFamily: 0,
      oopMetIndividual: 0,
      oopMetFamily: 0,
      eligible: false,
      eligibilityNote: "Coverage ended Sep 30, 2026. Not currently eligible."
    },
    {
      memberId: "MBR1007",
      firstName: "Aisha",
      lastName: "Patel",
      dob: "1975-12-05",
      zip: "85012",
      language: "en",
      planId: "PPO-PLAT",
      ssnLast4: "6789",
      phone: "(602) 555-0107",
      email: "aisha.p@example.com",
      deductibleMetIndividual: 500,
      deductibleMetFamily: 500,
      oopMetIndividual: 900,
      oopMetFamily: 900,
      eligible: true,
      eligibilityNote: "Active coverage. Deductible fully met for the year."
    },
    {
      memberId: "MBR1008",
      firstName: "Robert",
      lastName: "Taylor",
      dob: "1958-08-23",
      zip: "85020",
      language: "en",
      planId: "HMO-SILVER",
      ssnLast4: "0123",
      phone: "(602) 555-0108",
      email: "robert.t@example.com",
      deductibleMetIndividual: 1500,
      deductibleMetFamily: 2900,
      oopMetIndividual: 6200,
      oopMetFamily: 11e3,
      eligible: true,
      eligibilityNote: "Active coverage. Out-of-pocket maximum nearly met."
    }
  ];
  var CLAIMS = [
    { claimId: "CLM-9001", memberId: "MBR1001", dateOfService: "2026-03-12", provider: "Desert Valley Medical", service: "Office visit - Primary care", amountBilled: 450, amountPaid: 320, patientResponsibility: 25, status: "approved", eobSent: true, paidDate: "2026-03-20" },
    { claimId: "CLM-9002", memberId: "MBR1001", dateOfService: "2026-04-02", provider: "Sonoran Imaging", service: "MRI - Knee", amountBilled: 1850, amountPaid: 1200, patientResponsibility: 350, status: "approved", eobSent: true, paidDate: "2026-04-15" },
    { claimId: "CLM-9003", memberId: "MBR1001", dateOfService: "2026-05-18", provider: "Valley Physical Therapy", service: "Physical therapy - 6 visits", amountBilled: 900, amountPaid: 0, patientResponsibility: 0, status: "pending", eobSent: false },
    { claimId: "CLM-9101", memberId: "MBR1002", dateOfService: "2026-02-10", provider: "Phoenix Family Health", service: "Annual wellness exam", amountBilled: 300, amountPaid: 300, patientResponsibility: 0, status: "approved", eobSent: true, paidDate: "2026-02-22" },
    { claimId: "CLM-9102", memberId: "MBR1002", dateOfService: "2026-04-28", provider: "Desert Cardiology", service: "Cardiology consult", amountBilled: 650, amountPaid: 0, patientResponsibility: 0, status: "denied", denialReason: "Prior authorization required and not obtained.", eobSent: true },
    { claimId: "CLM-9201", memberId: "MBR1003", dateOfService: "2026-03-05", provider: "Tempe Urgent Care", service: "Urgent care visit", amountBilled: 280, amountPaid: 0, patientResponsibility: 280, status: "approved", eobSent: true, paidDate: "2026-03-14" },
    { claimId: "CLM-9202", memberId: "MBR1003", dateOfService: "2026-05-01", provider: "Banner Lab Services", service: "Lab panel - Blood work", amountBilled: 420, amountPaid: 150, patientResponsibility: 270, status: "approved", eobSent: true, paidDate: "2026-05-10" },
    { claimId: "CLM-9301", memberId: "MBR1004", dateOfService: "2026-01-15", provider: "Mayo Clinic Arizona", service: "Specialist - Orthopedics", amountBilled: 1200, amountPaid: 1100, patientResponsibility: 50, status: "approved", eobSent: true, paidDate: "2026-01-28" },
    { claimId: "CLM-9302", memberId: "MBR1004", dateOfService: "2026-04-20", provider: "Desert Valley Medical", service: "Office visit - Follow-up", amountBilled: 200, amountPaid: 150, patientResponsibility: 25, status: "approved", eobSent: true, paidDate: "2026-05-02" },
    { claimId: "CLM-9401", memberId: "MBR1005", dateOfService: "2026-03-22", provider: "South Mountain Pediatrics", service: "Well-child visit", amountBilled: 350, amountPaid: 350, patientResponsibility: 0, status: "approved", eobSent: true, paidDate: "2026-04-01" },
    { claimId: "CLM-9402", memberId: "MBR1005", dateOfService: "2026-05-11", provider: "Valley Physical Therapy", service: "Physical therapy - 4 visits", amountBilled: 600, amountPaid: 0, patientResponsibility: 0, status: "pending", eobSent: false },
    { claimId: "CLM-9501", memberId: "MBR1006", dateOfService: "2026-05-30", provider: "Scottsdale Dermatology", service: "Dermatology consult", amountBilled: 400, amountPaid: 0, patientResponsibility: 0, status: "denied", denialReason: "Member not eligible on date of service.", eobSent: true },
    { claimId: "CLM-9601", memberId: "MBR1007", dateOfService: "2026-02-18", provider: "Paradise Valley Hospital", service: "Outpatient surgery", amountBilled: 8400, amountPaid: 7900, patientResponsibility: 200, status: "approved", eobSent: true, paidDate: "2026-03-05" },
    { claimId: "CLM-9602", memberId: "MBR1007", dateOfService: "2026-04-09", provider: "Desert Valley Medical", service: "Office visit - Primary care", amountBilled: 180, amountPaid: 165, patientResponsibility: 15, status: "approved", eobSent: true, paidDate: "2026-04-18" },
    { claimId: "CLM-9701", memberId: "MBR1008", dateOfService: "2026-03-30", provider: "Out-of-Network Imaging Center", service: "CT scan", amountBilled: 2200, amountPaid: 0, patientResponsibility: 0, status: "denied", denialReason: "Out-of-network provider. No out-of-network benefit for this service.", eobSent: true }
  ];
  var PROVIDERS = [
    { id: "PRV-01", name: "Desert Valley Medical", specialty: "Primary Care", address: "1234 E Camelback Rd", city: "Phoenix", zip: "85014", phone: "(602) 555-2001", inNetwork: true, distanceMiles: 2.1, acceptingNew: true },
    { id: "PRV-02", name: "Phoenix Family Health", specialty: "Primary Care", address: "5678 N 7th St", city: "Phoenix", zip: "85014", phone: "(602) 555-2002", inNetwork: true, distanceMiles: 3.4, acceptingNew: true },
    { id: "PRV-03", name: "Sonoran Imaging", specialty: "Radiology", address: "9101 E Thomas Rd", city: "Scottsdale", zip: "85257", phone: "(480) 555-2003", inNetwork: true, distanceMiles: 5.8, acceptingNew: true },
    { id: "PRV-04", name: "Valley Physical Therapy", specialty: "Physical Therapy", address: "222 W McDowell Rd", city: "Phoenix", zip: "85004", phone: "(602) 555-2004", inNetwork: true, distanceMiles: 1.2, acceptingNew: true },
    { id: "PRV-05", name: "Desert Cardiology", specialty: "Cardiology", address: "4455 N 32nd St", city: "Phoenix", zip: "85018", phone: "(602) 555-2005", inNetwork: true, distanceMiles: 4, acceptingNew: false },
    { id: "PRV-06", name: "Tempe Urgent Care", specialty: "Urgent Care", address: "789 S Mill Ave", city: "Tempe", zip: "85281", phone: "(480) 555-2006", inNetwork: true, distanceMiles: 2.8, acceptingNew: true },
    { id: "PRV-07", name: "Out-of-Network Imaging Center", specialty: "Radiology", address: "999 E Outlier Way", city: "Glendale", zip: "85301", phone: "(623) 555-2007", inNetwork: false, distanceMiles: 12.5, acceptingNew: true },
    { id: "PRV-08", name: "Banner Lab Services", specialty: "Laboratory", address: "321 N Central Ave", city: "Phoenix", zip: "85004", phone: "(602) 555-2008", inNetwork: true, distanceMiles: 1.5, acceptingNew: true }
  ];
  var PRIOR_AUTHS = [
    { authId: "PA-5001", memberId: "MBR1001", service: "MRI - Knee", status: "approved", requestedDate: "2026-03-01", decisionDate: "2026-03-03", notes: "Approved for 1 MRI." },
    { authId: "PA-5002", memberId: "MBR1001", service: "Physical therapy - 12 visits", status: "pending", requestedDate: "2026-05-15", notes: "Under clinical review. Decision expected within 5 business days." },
    { authId: "PA-5101", memberId: "MBR1002", service: "Cardiology consult", status: "denied", requestedDate: "2026-04-10", decisionDate: "2026-04-12", notes: "Denied \u2014 prior authorization was not obtained before service. Appeal rights apply." },
    { authId: "PA-5201", memberId: "MBR1003", service: "Lab panel - Blood work", status: "approved", requestedDate: "2026-04-25", decisionDate: "2026-04-26", notes: "Approved." },
    { authId: "PA-5301", memberId: "MBR1007", service: "Outpatient surgery", status: "approved", requestedDate: "2026-02-10", decisionDate: "2026-02-12", notes: "Approved." },
    { authId: "PA-5401", memberId: "MBR1008", service: "CT scan", status: "denied", requestedDate: "2026-03-20", decisionDate: "2026-03-22", notes: "Denied \u2014 out-of-network provider." }
  ];
  function findMember(memberId) {
    const normalized = memberId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return MEMBERS.find((m) => m.memberId === normalized);
  }
  function findPlan(planId) {
    return PLANS.find((p) => p.id === planId);
  }
  function claimsFor(memberId) {
    return CLAIMS.filter((c) => c.memberId === memberId).sort((a, b) => b.dateOfService.localeCompare(a.dateOfService));
  }
  function authsFor(memberId) {
    return PRIOR_AUTHS.filter((a) => a.memberId === memberId);
  }

  // src/agent/tools.ts
  function verifyMember(memberId) {
    const member = findMember(memberId);
    if (!member) return { ok: false, tool: "verifyMember", error: "MEMBER_NOT_FOUND" };
    return { ok: true, tool: "verifyMember", data: member };
  }
  function verifyDob(member, dobInput) {
    const normalized = normalizeDob(dobInput);
    return normalized === member.dob;
  }
  function verifyZip(member, zipInput) {
    const digits = zipInput.replace(/\D/g, "").slice(0, 5);
    return digits === member.zip;
  }
  function normalizeDob(input) {
    const s = input.trim();
    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
    const mdy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
    const months = {
      january: "01",
      february: "02",
      march: "03",
      april: "04",
      may: "05",
      june: "06",
      july: "07",
      august: "08",
      september: "09",
      october: "10",
      november: "11",
      december: "12",
      enero: "01",
      febrero: "02",
      marzo: "03",
      abril: "04",
      mayo: "05",
      junio: "06",
      julio: "07",
      agosto: "08",
      septiembre: "09",
      octubre: "10",
      noviembre: "11",
      diciembre: "12"
    };
    const m1 = s.toLowerCase().match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (m1 && months[m1[1]]) return `${m1[3]}-${months[m1[1]]}-${m1[2].padStart(2, "0")}`;
    const m2 = s.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/);
    if (m2 && months[m2[2]]) return `${m2[3]}-${months[m2[2]]}-${m2[1].padStart(2, "0")}`;
    return null;
  }
  function getClaimStatus(memberId, claimId) {
    const claims = claimsFor(memberId);
    if (claimId) {
      const c = claims.find((x) => x.claimId.toUpperCase() === claimId.toUpperCase());
      if (!c) return { ok: false, tool: "getClaimStatus", error: "CLAIM_NOT_FOUND" };
      return { ok: true, tool: "getClaimStatus", data: c };
    }
    return { ok: true, tool: "getClaimStatus", data: claims };
  }
  function getEligibility(memberId) {
    const member = findMember(memberId);
    if (!member) return { ok: false, tool: "getEligibility", error: "MEMBER_NOT_FOUND" };
    return { ok: true, tool: "getEligibility", data: { member, plan: findPlan(member.planId) } };
  }
  function getBenefits(memberId) {
    const member = findMember(memberId);
    if (!member) return { ok: false, tool: "getBenefits", error: "MEMBER_NOT_FOUND" };
    const plan = findPlan(member.planId);
    if (!plan) return { ok: false, tool: "getBenefits", error: "PLAN_NOT_FOUND" };
    const remainingDeductible = Math.max(0, plan.deductibleIndividual - member.deductibleMetIndividual);
    const remainingOop = Math.max(0, plan.outOfPocketMaxIndividual - member.oopMetIndividual);
    return {
      ok: true,
      tool: "getBenefits",
      data: {
        member: { firstName: member.firstName, lastName: member.lastName, planId: member.planId },
        plan,
        deductibleMetIndividual: member.deductibleMetIndividual,
        deductibleRemainingIndividual: remainingDeductible,
        oopMetIndividual: member.oopMetIndividual,
        oopRemainingIndividual: remainingOop
      }
    };
  }
  function requestIdCard(memberId) {
    const member = findMember(memberId);
    if (!member) return { ok: false, tool: "requestIdCard", error: "MEMBER_NOT_FOUND" };
    return { ok: true, tool: "requestIdCard", data: { memberId, action: "ID_CARD_REISSUE_REQUESTED", eta: "7-10 business days by mail, digital card available immediately" } };
  }
  function findProvider(specialty, zip) {
    let list = [...PROVIDERS];
    if (specialty) {
      const q = specialty.toLowerCase();
      list = list.filter((p) => p.specialty.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }
    list.sort((a, b) => Number(b.inNetwork) - Number(a.inNetwork) || a.distanceMiles - b.distanceMiles);
    return { ok: true, tool: "findProvider", data: list.slice(0, 3) };
  }
  function getPriorAuthStatus(memberId, authId) {
    const auths = authsFor(memberId);
    if (authId) {
      const a = auths.find((x) => x.authId.toUpperCase() === authId.toUpperCase());
      if (!a) return { ok: false, tool: "getPriorAuthStatus", error: "AUTH_NOT_FOUND" };
      return { ok: true, tool: "getPriorAuthStatus", data: a };
    }
    return { ok: true, tool: "getPriorAuthStatus", data: auths };
  }
  function createEscalation(reason, memberId, intent, summary) {
    return { reason, memberId, intent, summary, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  }

  // src/agent/guardrails.ts
  var APPEAL_PATTERNS = [/\bappeal\b/i, /\bgrievance\b/i, /\bcomplaint\b/i, /\bdenied.*unfair/i, /\bdispute\b/i, /\blawsuit\b/i, /\blawyer\b/i, /\battorney\b/i, /\bapel/i, /\bqueja\b/i];
  var SUPERVISOR_PATTERNS = [/\bsupervisor\b/i, /\bmanager\b/i, /\bhuman\b/i, /\brepresentative\b/i, /\bagent\b/i, /\bperson\b/i, /\brepresentante\b/i, /\bhumano\b/i];
  var ANGER_PATTERNS = [/\bangry\b/i, /\bfrustrat/i, /\bterrible\b/i, /\bawful\b/i, /\buseless\b/i, /\bridiculous\b/i, /\bstupid\b/i, /\bthis is.*bad\b/i, /\benojad/i, /\bfrustrad/i, /\bterrible\b/i];
  var EMERGENCY_PATTERNS = [/\bchest pain\b/i, /\bcan.?t breathe\b/i, /\btrouble breathing\b/i, /\bdifficulty breathing\b/i, /\bsevere bleeding\b/i, /\bunconscious\b/i, /\bheart attack\b/i, /\bstroke\b/i, /\bdolor.*pecho\b/i, /\bno puedo respirar\b/i];
  function detectEscalation(text) {
    if (EMERGENCY_PATTERNS.some((r) => r.test(text))) return "MEDICAL_EMERGENCY";
    if (APPEAL_PATTERNS.some((r) => r.test(text))) return "APPEAL_OR_GRIEVANCE";
    if (ANGER_PATTERNS.some((r) => r.test(text))) return "ANGER";
    if (/\btalk to (a |the )?(supervisor|manager|human|person|representative|agent)\b/i.test(text)) return "REQUEST_SUPERVISOR";
    if (SUPERVISOR_PATTERNS.some((r) => r.test(text)) && /\b(speak|talk|connect|transfer)\b/i.test(text)) return "REQUEST_SUPERVISOR";
    return null;
  }
  function isMedicalEmergency(text) {
    return EMERGENCY_PATTERNS.some((r) => r.test(text));
  }
  function canDisclosePhi(state) {
    return state === "AUTHENTICATED" || state === "INTENT" || state === "TOOL_CALL" || state === "ANSWER" || state === "FOLLOW_UP";
  }
  function redactForLog(text) {
    let out = text;
    out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED-SSN]");
    out = out.replace(/\b\d{9}\b/g, "[REDACTED-SSN]");
    out = out.replace(/\b\d{4}-\d{2}-\d{2}\b/g, "[REDACTED-DOB]");
    out = out.replace(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, "[REDACTED-DOB]");
    out = out.replace(/\bMBR(\d{4})\b/gi, (_, d) => `MBR****${d.slice(-2)}`);
    return out;
  }
  function audit(entries, type, detail) {
    entries.push({ ts: (/* @__PURE__ */ new Date()).toISOString(), type, detail: redactForLog(detail) });
  }

  // src/agent/engine.ts
  function createSession(sessionId, language = "en") {
    const s = {
      sessionId,
      state: "GREETING",
      language,
      verified: false,
      transcript: [],
      toolCalls: [],
      auditLog: [],
      attempts: { id: 0, dob: 0, zip: 0 },
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      ended: false
    };
    audit(s.auditLog, "AGENT", "Session created");
    return s;
  }
  function fmtMoney(n) {
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  function fmtDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[m - 1]} ${d}, ${y}`;
  }
  function extractMemberId(text) {
    const m = text.toUpperCase().match(/MBR\s?[- ]?(\d{4})/);
    if (m) return `MBR${m[1]}`;
    const bare = text.trim().match(/^(\d{4})$/);
    if (bare) return `MBR${bare[1]}`;
    return null;
  }
  function extractClaimId(text) {
    const m = text.toUpperCase().match(/CLM[-\s]?(\d{4})/);
    if (m) return `CLM-${m[1]}`;
    return null;
  }
  function extractAuthId(text) {
    const m = text.toUpperCase().match(/PA[-\s]?(\d{4})/);
    if (m) return `PA-${m[1]}`;
    return null;
  }
  function extractZip(text) {
    const m = text.match(/\b(\d{5})\b/);
    return m ? m[1] : null;
  }
  function extractDob(text) {
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
  function detectIntent(text) {
    const l = text.toLowerCase();
    if (/(claim|reclam)/.test(l)) return "claims_status";
    if (/(eligib|elegib|coverage|covered|cobertura)/.test(l)) return "eligibility";
    if (/(deductible|deducible|benefit|benefici|out.of.pocket|copay|bolsillo)/.test(l)) return "benefits_deductible";
    if (/(id card|tarjeta|id-card|new card)/.test(l)) return "id_card";
    if (/(provider|doctor|proveedor|médico|medico|cardiolog|dermatolog|radiolog|pediatric|orthopedic|physical therapy|urgent care|laboratory|in.network|in-network|network|find a )/.test(l)) return "provider_lookup";
    if (/(prior auth|pre\.auth|preauth|prior authorization|autorizaci|auth)/.test(l)) return "prior_auth_status";
    if (/(appeal|grievance|supervisor|human|representative|agent|representante|humano)/.test(l)) return "escalation";
    return "unknown";
  }
  function pushTranscript(s, speaker, text) {
    s.transcript.push({ speaker, text, ts: (/* @__PURE__ */ new Date()).toISOString() });
  }
  function handleMessage(session, userTextRaw, languageOverride) {
    const userText = userTextRaw.trim();
    if (languageOverride) session.language = languageOverride;
    const lang = session.language;
    pushTranscript(session, "user", userText);
    audit(session.auditLog, "USER", userText);
    const finish = (reply, actions = [], suggested = []) => {
      pushTranscript(session, "agent", reply);
      audit(session.auditLog, "AGENT", reply);
      return {
        reply,
        state: session.state,
        language: lang,
        verified: session.verified,
        memberName: session.memberName,
        intent: session.intent,
        toolCalls: [...session.toolCalls],
        escalation: session.escalation,
        actions,
        suggestedReplies: suggested
      };
    };
    const doEscalate = (reason) => {
      session.state = "ESCALATE";
      const esc = createEscalation(reason, session.memberId, session.intent, session.transcript.map((x) => `${x.speaker}: ${x.text}`).join(" | ").slice(0, 2e3));
      session.escalation = esc;
      audit(session.auditLog, "ESCALATION", `Escalated: ${reason}`);
      const msg = lang === "es" ? `${t(lang, "escalated")} (${reason})` : `${t(lang, "escalated")} Reason: ${reason}.`;
      return finish(msg, ["SHOW_ESCALATION", "END_CALL"], ["End call"]);
    };
    if (isMedicalEmergency(userText)) {
      return finish(t(lang, "emergency"), ["SHOW_ESCALATION"], ["Connect to representative"]);
    }
    const escReason = detectEscalation(userText);
    if (escReason === "APPEAL_OR_GRIEVANCE" || escReason === "REQUEST_SUPERVISOR" || escReason === "ANGER") {
      if (session.state !== "VERIFY_ID" && session.state !== "VERIFY_DOB" && session.state !== "VERIFY_ZIP") {
        return doEscalate(escReason);
      }
      if (escReason === "APPEAL_OR_GRIEVANCE" || escReason === "REQUEST_SUPERVISOR") return doEscalate(escReason);
    }
    if (/\b(bye|goodbye|adios|adiós|that's all|eso es todo|no,? (thanks|thank you)|no gracias)\b/i.test(userText) && session.verified) {
      session.state = "END";
      session.ended = true;
      return finish(t(lang, "goodbye"), ["END_CALL"], []);
    }
    switch (session.state) {
      case "GREETING": {
        session.state = "VERIFY_ID";
        const id = extractMemberId(userText);
        if (id) {
          const res = verifyMember(id);
          if (res.ok && res.data) {
            session.memberId = res.data.memberId;
            session.memberName = `${res.data.firstName} ${res.data.lastName}`;
            if (res.data.language === "es" && !languageOverride) session.language = "es";
            session.state = "VERIFY_DOB";
            session.toolCalls.push({ tool: "verifyMember", input: id, outputSummary: `Found member ${session.memberName}`, ts: (/* @__PURE__ */ new Date()).toISOString() });
            audit(session.auditLog, "TOOL", `verifyMember ${id} -> found`);
            const confirm = `${t(session.language, "idConfirm")} ${toNato(id)}, ${session.memberName}.`;
            return finish(`${confirm} ${t(session.language, "askDob")}`, [], []);
          }
          session.attempts.id += 1;
          return finish(t(lang, "notFoundId"), [], ["MBR1001", "MBR1002", "MBR1003"]);
        }
        return finish(t(lang, "greeting"), [], ["MBR1001", "MBR1002", "MBR1003"]);
      }
      case "VERIFY_ID": {
        const id = extractMemberId(userText);
        if (!id) {
          session.attempts.id += 1;
          if (session.attempts.id >= 3) return doEscalate("VERIFICATION_FAILED");
          return finish(t(lang, "notFoundId"), [], ["MBR1001", "MBR1002", "MBR1003"]);
        }
        const res = verifyMember(id);
        if (!res.ok || !res.data) {
          session.attempts.id += 1;
          if (session.attempts.id >= 3) return doEscalate("VERIFICATION_FAILED");
          return finish(t(lang, "notFoundId"), [], ["MBR1001", "MBR1002", "MBR1003"]);
        }
        session.memberId = res.data.memberId;
        session.memberName = `${res.data.firstName} ${res.data.lastName}`;
        if (res.data.language === "es" && !languageOverride) session.language = "es";
        session.state = "VERIFY_DOB";
        session.toolCalls.push({ tool: "verifyMember", input: id, outputSummary: `Found member ${session.memberName}`, ts: (/* @__PURE__ */ new Date()).toISOString() });
        audit(session.auditLog, "TOOL", `verifyMember ${id} -> found`);
        const confirm = `${t(session.language, "idConfirm")} ${toNato(id)}, ${session.memberName}.`;
        return finish(`${confirm} ${t(session.language, "askDob")}`, [], []);
      }
      case "VERIFY_DOB": {
        const member = session.memberId ? findMember(session.memberId) : void 0;
        if (!member) {
          session.state = "VERIFY_ID";
          return finish(t(lang, "notFoundId"), [], []);
        }
        const dob = extractDob(userText);
        if (!dob || !verifyDob(member, dob)) {
          session.attempts.dob += 1;
          if (session.attempts.dob >= 3) return doEscalate("VERIFICATION_FAILED");
          return finish(t(lang, "wrongDob"), [], []);
        }
        session.state = "VERIFY_ZIP";
        audit(session.auditLog, "TOOL", "verifyDob -> matched");
        return finish(t(lang, "askZip"), [], []);
      }
      case "VERIFY_ZIP": {
        const member = session.memberId ? findMember(session.memberId) : void 0;
        if (!member) {
          session.state = "VERIFY_ID";
          return finish(t(lang, "notFoundId"), [], []);
        }
        const zip = extractZip(userText);
        if (!zip || !verifyZip(member, zip)) {
          session.attempts.zip += 1;
          if (session.attempts.zip >= 3) return doEscalate("VERIFICATION_FAILED");
          return finish(t(lang, "wrongZip"), [], []);
        }
        session.verified = true;
        session.state = "AUTHENTICATED";
        audit(session.auditLog, "TOOL", "verifyZip -> matched, verified");
        return finish(t(lang, "verified"), [], lang === "es" ? ["Estado de reclamos", "Elegibilidad", "Beneficios"] : ["Claims status", "Eligibility", "Benefits"]);
      }
      case "AUTHENTICATED":
      case "INTENT":
      case "TOOL_CALL":
      case "ANSWER":
      case "FOLLOW_UP": {
        if (!canDisclosePhi(session.state) || !session.verified) {
          session.state = "VERIFY_ID";
          return finish(t(lang, "needVerification"), [], []);
        }
        if (session.state === "FOLLOW_UP") {
          if (/^\s*(yes|yeah|sure|si|sí)\b/i.test(userText)) {
            session.state = "INTENT";
            return finish(t(lang, "askIntent"), [], lang === "es" ? ["Estado de reclamos", "Elegibilidad", "Beneficios"] : ["Claims status", "Eligibility", "Benefits"]);
          }
          if (/^\s*(no|nope|no thanks|no,?\s*thanks|no gracias)\b/i.test(userText)) {
            session.state = "END";
            session.ended = true;
            return finish(t(lang, "goodbye"), ["END_CALL"], []);
          }
        }
        const intent = detectIntent(userText);
        session.intent = intent;
        session.state = "INTENT";
        if (intent === "unknown") {
          return finish(t(lang, "didNotUnderstand"), [], lang === "es" ? ["Estado de reclamos", "Elegibilidad", "Beneficios"] : ["Claims status", "Eligibility", "Benefits"]);
        }
        if (intent === "escalation") return doEscalate("REQUEST_SUPERVISOR");
        session.state = "TOOL_CALL";
        const memberId = session.memberId;
        let answer = "";
        let suggested = [];
        if (intent === "claims_status") {
          const claimId = extractClaimId(userText);
          const res = getClaimStatus(memberId, claimId ?? void 0);
          if (!res.ok) return finish(t(lang, "noRecord"), ["SHOW_TOOL_CALLS"], [t(lang, "escalateOffer")]);
          session.toolCalls.push({ tool: "getClaimStatus", input: claimId ?? `member ${memberId}`, outputSummary: `Returned ${Array.isArray(res.data) ? res.data.length : 1} claim(s)`, ts: (/* @__PURE__ */ new Date()).toISOString() });
          audit(session.auditLog, "TOOL", `getClaimStatus ${memberId} -> ok`);
          if (Array.isArray(res.data)) {
            const claims = res.data;
            if (claims.length === 0) answer = t(lang, "noRecord");
            else if (lang === "es") {
              const lines = claims.slice(0, 3).map((c) => `${c.claimId} del ${fmtDate(c.dateOfService)} en ${c.provider}: ${c.status === "approved" ? "aprobado" : c.status === "pending" ? "pendiente" : "denegado"}, facturado ${fmtMoney(c.amountBilled)}, pagado ${fmtMoney(c.amountPaid)}${c.status === "denied" && c.denialReason ? `. Motivo: ${c.denialReason}` : ""}`);
              answer = `Encontr\xE9 ${claims.length} reclamo(s). El m\xE1s reciente: ${lines[0]}. \xBFQuiere detalles de otro reclamo o que le enviemos el EOB?`;
            } else {
              const lines = claims.slice(0, 3).map((c) => `${c.claimId} from ${fmtDate(c.dateOfService)} at ${c.provider}: ${c.status}, billed ${fmtMoney(c.amountBilled)}, paid ${fmtMoney(c.amountPaid)}${c.status === "denied" && c.denialReason ? `. Denial reason: ${c.denialReason}` : ""}${c.status === "pending" ? " \u2014 still processing" : ""}`);
              answer = `I found ${claims.length} claim(s). The most recent: ${lines[0]}.`;
              if (claims.length > 1) answer += ` Next: ${lines[1]}.`;
              answer += ` Would you like details on another claim, or an EOB emailed?`;
            }
          } else {
            const c = res.data;
            answer = lang === "es" ? `${c.claimId} del ${fmtDate(c.dateOfService)} en ${c.provider}: ${c.status === "approved" ? "aprobado" : c.status === "pending" ? "pendiente" : "denegado"}, facturado ${fmtMoney(c.amountBilled)}, pagado ${fmtMoney(c.amountPaid)}${c.status === "denied" && c.denialReason ? `. Motivo: ${c.denialReason}` : ""}` : `${c.claimId} from ${fmtDate(c.dateOfService)} at ${c.provider}: ${c.status}, billed ${fmtMoney(c.amountBilled)}, paid ${fmtMoney(c.amountPaid)}, patient responsibility ${fmtMoney(c.patientResponsibility)}${c.status === "denied" && c.denialReason ? `. Denial reason: ${c.denialReason}` : ""}${c.paidDate ? `, paid on ${fmtDate(c.paidDate)}` : ""}.`;
          }
          suggested = lang === "es" ? ["Elegibilidad", "Beneficios"] : ["Eligibility", "Benefits"];
        } else if (intent === "eligibility") {
          const res = getEligibility(memberId);
          if (!res.ok || !res.data) return finish(t(lang, "noRecord"), [], []);
          session.toolCalls.push({ tool: "getEligibility", input: memberId, outputSummary: `Eligible=${res.data.member.eligible}`, ts: (/* @__PURE__ */ new Date()).toISOString() });
          audit(session.auditLog, "TOOL", `getEligibility ${memberId} -> ok`);
          answer = lang === "es" ? `${res.data.member.firstName} ${res.data.member.lastName}, su cobertura ${res.data.member.eligible ? "est\xE1 activa" : "no est\xE1 activa"} en el plan ${res.data.plan?.name ?? res.data.member.planId}. ${res.data.member.eligibilityNote}` : `${res.data.member.firstName} ${res.data.member.lastName}, your coverage is ${res.data.member.eligible ? "active" : "not active"} on ${res.data.plan?.name ?? res.data.member.planId}. ${res.data.member.eligibilityNote}`;
          suggested = lang === "es" ? ["Beneficios", "Estado de reclamos"] : ["Benefits", "Claims status"];
        } else if (intent === "benefits_deductible") {
          const res = getBenefits(memberId);
          if (!res.ok || !res.data) return finish(t(lang, "noRecord"), [], []);
          const d = res.data;
          session.toolCalls.push({ tool: "getBenefits", input: memberId, outputSummary: `Plan ${d.plan.name}, deductible met ${fmtMoney(d.deductibleMetIndividual)}`, ts: (/* @__PURE__ */ new Date()).toISOString() });
          audit(session.auditLog, "TOOL", `getBenefits ${memberId} -> ok`);
          answer = lang === "es" ? `En su plan ${d.plan.name}: ha cumplido ${fmtMoney(d.deductibleMetIndividual)} de un deducible individual de ${fmtMoney(d.plan.deductibleIndividual)}, le quedan ${fmtMoney(d.deductibleRemainingIndividual)}. Ha cumplido ${fmtMoney(d.oopMetIndividual)} de un m\xE1ximo de bolsillo de ${fmtMoney(d.plan.outOfPocketMaxIndividual)}. Copago: primaria ${fmtMoney(d.plan.copayPrimary)}, especialista ${fmtMoney(d.plan.copaySpecialist)}.` : `On your ${d.plan.name} plan: you have met ${fmtMoney(d.deductibleMetIndividual)} of your ${fmtMoney(d.plan.deductibleIndividual)} individual deductible, so ${fmtMoney(d.deductibleRemainingIndividual)} remains. You have met ${fmtMoney(d.oopMetIndividual)} of your ${fmtMoney(d.plan.outOfPocketMaxIndividual)} out-of-pocket maximum. Copays: primary ${fmtMoney(d.plan.copayPrimary)}, specialist ${fmtMoney(d.plan.copaySpecialist)}.`;
          suggested = lang === "es" ? ["Elegibilidad", "Estado de reclamos"] : ["Eligibility", "Claims status"];
        } else if (intent === "id_card") {
          const res = requestIdCard(memberId);
          session.toolCalls.push({ tool: "requestIdCard", input: memberId, outputSummary: "ID card reissue requested", ts: (/* @__PURE__ */ new Date()).toISOString() });
          audit(session.auditLog, "TOOL", `requestIdCard ${memberId} -> requested`);
          answer = lang === "es" ? `He solicitado una nueva tarjeta de identificaci\xF3n. Llegar\xE1 por correo en 7 a 10 d\xEDas h\xE1biles, y su tarjeta digital est\xE1 disponible de inmediato.` : `I've requested a new ID card for you. It will arrive by mail in 7 to 10 business days, and your digital card is available immediately.`;
          suggested = lang === "es" ? ["Elegibilidad", "Beneficios"] : ["Eligibility", "Benefits"];
        } else if (intent === "provider_lookup") {
          const lower = userText.toLowerCase();
          const specMap = {
            cardiologist: "cardiology",
            dermatologist: "dermatology",
            radiologist: "radiology",
            pediatrician: "pediatrics",
            orthopedist: "orthopedics"
          };
          let specialty;
          for (const [k, v] of Object.entries(specMap)) {
            if (lower.includes(k)) {
              specialty = v;
              break;
            }
          }
          if (!specialty) {
            const specMatch = lower.match(/(primary care|cardiology|radiology|physical therapy|urgent care|dermatology|laboratory|pediatrics|orthopedics)/);
            specialty = specMatch ? specMatch[1] : void 0;
          }
          const res = findProvider(specialty);
          const list = res.data;
          session.toolCalls.push({ tool: "findProvider", input: specialty ?? "any", outputSummary: `Returned ${list.length} providers`, ts: (/* @__PURE__ */ new Date()).toISOString() });
          audit(session.auditLog, "TOOL", `findProvider -> ${list.length} results`);
          if (list.length === 0) answer = t(lang, "noRecord");
          else {
            const fmt = (p) => `${p.name} \u2014 ${p.specialty}, ${p.address}, ${p.city} ${p.zip}, ${p.phone}, ${p.inNetwork ? lang === "es" ? "en red" : "in-network" : lang === "es" ? "fuera de red" : "out-of-network"}, ${p.distanceMiles} miles`;
            answer = lang === "es" ? `Encontr\xE9 ${list.length} proveedor(es): ${list.map(fmt).join("; ")}.` : `I found ${list.length} provider(s): ${list.map(fmt).join("; ")}.`;
          }
          suggested = lang === "es" ? ["Elegibilidad", "Beneficios"] : ["Eligibility", "Benefits"];
        } else if (intent === "prior_auth_status") {
          const authId = extractAuthId(userText);
          const res = getPriorAuthStatus(memberId, authId ?? void 0);
          if (!res.ok) return finish(t(lang, "noRecord"), [], []);
          const auths = Array.isArray(res.data) ? res.data : [res.data];
          session.toolCalls.push({ tool: "getPriorAuthStatus", input: authId ?? memberId, outputSummary: `Returned ${auths.length} auth(s)`, ts: (/* @__PURE__ */ new Date()).toISOString() });
          audit(session.auditLog, "TOOL", `getPriorAuthStatus ${memberId} -> ok`);
          if (auths.length === 0) answer = t(lang, "noRecord");
          else {
            const fmt = (a) => `${a.authId} for ${a.service}: ${a.status}${a.decisionDate ? `, decided ${fmtDate(a.decisionDate)}` : `, requested ${fmtDate(a.requestedDate)}`}. ${a.notes}`;
            answer = lang === "es" ? `Encontr\xE9 ${auths.length} autorizaci\xF3n(es) previa(s): ${auths.map(fmt).join(" ")}` : `I found ${auths.length} prior auth(s): ${auths.map(fmt).join(" ")}`;
          }
          suggested = lang === "es" ? ["Estado de reclamos", "Beneficios"] : ["Claims status", "Benefits"];
        }
        session.state = "FOLLOW_UP";
        const full = `${answer} ${t(lang, "followUp")}`;
        return finish(full, ["SHOW_TOOL_CALLS"], suggested);
      }
      default: {
        return finish(t(lang, "didNotUnderstand"), [], []);
      }
    }
  }
  function getSummary(session) {
    return {
      sessionId: session.sessionId,
      state: session.state,
      verified: session.verified,
      memberId: session.memberId ? `${session.memberId.slice(0, 3)}****${session.memberId.slice(-2)}` : void 0,
      memberName: session.memberName,
      language: session.language,
      intent: session.intent,
      toolCalls: session.toolCalls,
      escalation: session.escalation,
      transcript: session.transcript,
      auditLog: session.auditLog,
      ended: session.ended
    };
  }

  // src/browser/entry.ts
  function escalateSession(session, reason = "MANUAL") {
    const esc = createEscalation(reason, session.memberId, session.intent, "Manual escalation from demo UI");
    session.escalation = esc;
    session.state = "ESCALATE";
    audit(session.auditLog, "ESCALATION", `Manual escalation: ${reason}`);
    return esc;
  }
  if (typeof window !== "undefined") {
    window.TPAAgent = { createSession, handleMessage, getSummary, escalateSession };
  }
  return __toCommonJS(entry_exports);
})();
