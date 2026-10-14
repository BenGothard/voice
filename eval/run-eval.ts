/**
 * Eval runner — runs eval/scenarios.json against the deterministic engine.
 * Usage: npm run eval
 * Exit 0 if all scenarios pass, 1 if any fail.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSession, handleMessage } from '../src/agent/engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Turn = { user: string; expect?: string[] };
type Scenario = {
  id: string;
  language?: 'en' | 'es';
  turns: Turn[];
  expectEscalation?: boolean;
  mustNotContain?: string[];
  shouldContain?: boolean;
};

const scenariosPath = path.join(__dirname, 'scenarios.json');
const scenarios: Scenario[] = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'));

let passed = 0;
let failed = 0;
const failures: string[] = [];

for (const sc of scenarios) {
  const session = createSession(`eval-${sc.id}`, sc.language ?? 'en');
  const allReplies: string[] = [];
  let ok = true;
  const reasons: string[] = [];

  for (let i = 0; i < sc.turns.length; i++) {
    const turn = sc.turns[i];
    const reply = handleMessage(session, turn.user, sc.language);
    allReplies.push(reply.reply);
    const expects = turn.expect ?? [];
    for (const exp of expects) {
      if (!reply.reply.toLowerCase().includes(exp.toLowerCase())) {
        ok = false;
        reasons.push(`turn ${i + 1} ("${turn.user}") — expected reply to contain "${exp}", got: "${reply.reply.slice(0, 200)}"`);
      }
    }
  }

  // mustNotContain — check across all replies
  if (sc.mustNotContain) {
    const joined = allReplies.join(' | ').toLowerCase();
    for (const banned of sc.mustNotContain) {
      if (joined.includes(banned.toLowerCase())) {
        ok = false;
        reasons.push(`mustNotContain violated — reply contained "${banned}"`);
      }
    }
  }

  // expectEscalation — final state should be ESCALATE or escalation present
  if (sc.expectEscalation) {
    if (session.state !== 'ESCALATE' && !session.escalation) {
      ok = false;
      reasons.push(`expected escalation, final state=${session.state}`);
    }
  }

  if (ok) {
    passed++;
    console.log(`PASS ${sc.id}`);
  } else {
    failed++;
    console.log(`FAIL ${sc.id}`);
    for (const r of reasons) console.log(`  - ${r}`);
    failures.push(sc.id);
  }
}

const total = scenarios.length;
const contained = total === 0 ? 0 : Math.round((passed / total) * 100);
console.log('');
console.log(`Eval: ${passed}/${total} passed (${contained}% scenario pass rate)`);
if (failed > 0) {
  console.log(`Failed: ${failures.join(', ')}`);
  process.exit(1);
}
