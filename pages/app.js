// Static GitHub Pages phone simulator — runs engine entirely in browser.
// No fetch, no server. Uses window.TPAAgent from bundle.js.
let currentSession = null;
let allSessions = [];
let timerId = null;
let seconds = 0;
let recognition = null;
let listening = false;

const $ = (id) => document.getElementById(id);
const transcriptEl = $('transcript');
const inputEl = $('input');

function fmtTimer(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}
function addBubble(text, who) {
  const div = document.createElement('div');
  div.className = `bubble ${who}`;
  div.textContent = text;
  transcriptEl.appendChild(div);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}
function speak(text) {
  if (!$('ttsToggle').checked) return;
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0; u.pitch = 1.0;
  const lang = $('langSelect').value === 'es' ? 'es-ES' : 'en-US';
  u.lang = lang;
  window.speechSynthesis.speak(u);
}
function renderSuggested(list) {
  const wrap = $('suggested');
  wrap.innerHTML = '';
  (list || []).forEach((s) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.textContent = s;
    b.onclick = () => { inputEl.value = s; sendMessage(); };
    wrap.appendChild(b);
  });
}
function renderToolCalls(calls) {
  const ul = $('toolCalls');
  if (!calls || calls.length === 0) { ul.innerHTML = '<li class="muted">No tool calls yet.</li>'; return; }
  ul.innerHTML = calls.map((c) => `<li><b>${c.tool}</b><br/><span class="muted">input:</span> ${escapeHtml(c.input)}<br/><span class="muted">result:</span> ${escapeHtml(c.outputSummary)}</li>`).join('');
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function updateVerification(reply) {
  const badge = $('verifyBadge');
  if (reply.verified) { badge.textContent = '✅ Verified'; badge.classList.add('ok'); }
  else { badge.textContent = '🔒 Not verified'; badge.classList.remove('ok'); }
  $('memberBadge').textContent = reply.memberName ? `Member: ${reply.memberName}` : '';
  if (reply.escalation) {
    $('escalationCard').hidden = false;
    $('escalationBody').innerHTML = `<b>Reason:</b> ${escapeHtml(reply.escalation.reason)}<br/><b>Intent:</b> ${escapeHtml(reply.escalation.intent || '-')}<br/><pre class="summary">${escapeHtml(reply.escalation.summary.slice(0, 800))}</pre>`;
  }
}
function startCall() {
  const sessionId = 'web-' + Math.random().toString(36).slice(2, 10);
  const lang = $('langSelect').value;
  currentSession = window.TPAAgent.createSession(sessionId, lang);
  allSessions.push(currentSession);
  seconds = 0;
  $('timer').textContent = '00:00';
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => { seconds++; $('timer').textContent = fmtTimer(seconds); }, 1000);
  $('callStatus').textContent = 'On call — agent connected';
  $('callBtn').disabled = true; $('endBtn').disabled = false; $('transferBtn').disabled = false;
  inputEl.disabled = false; $('sendBtn').disabled = false;
  transcriptEl.innerHTML = '';
  $('escalationCard').hidden = true;
  $('suggested').innerHTML = '';
  // Synthetic first turn to get greeting, then hide it
  const reply = window.TPAAgent.handleMessage(currentSession, 'hello', lang);
  currentSession.transcript = currentSession.transcript.filter((t) => !(t.speaker === 'user' && t.text === 'hello'));
  addBubble(reply.reply, 'agent');
  speak(reply.reply);
  updateVerification(reply);
  renderToolCalls(reply.toolCalls);
  renderSuggested(reply.suggestedReplies);
}
function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || !currentSession) return;
  addBubble(text, 'user');
  inputEl.value = '';
  $('typing').hidden = false;
  try {
    const reply = window.TPAAgent.handleMessage(currentSession, text, $('langSelect').value);
    $('typing').hidden = true;
    addBubble(reply.reply, 'agent');
    speak(reply.reply);
    updateVerification(reply);
    renderToolCalls(reply.toolCalls);
    renderSuggested(reply.suggestedReplies);
  } catch (e) {
    $('typing').hidden = true;
    addBubble('Error — please try again.', 'system');
  }
}
function endCall() {
  if (timerId) clearInterval(timerId);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  $('callStatus').textContent = 'Call ended';
  $('callBtn').disabled = false; $('endBtn').disabled = true; $('transferBtn').disabled = true;
  inputEl.disabled = true; $('sendBtn').disabled = true;
  addBubble('— Call ended —', 'system');
  refreshSummary();
}
function transfer() {
  if (!currentSession) return;
  window.TPAAgent.escalateSession(currentSession, 'MANUAL');
  addBubble('Connecting you to a representative. They will have your information and summary, so you will not need to repeat yourself.', 'agent');
  $('escalationCard').hidden = false;
  $('escalationBody').innerHTML = '<b>Reason:</b> MANUAL<br/>Manual transfer from demo UI.';
  refreshSummary();
}
function refreshSummary() {
  if (!currentSession) return;
  const s = window.TPAAgent.getSummary(currentSession);
  $('summary').textContent = JSON.stringify(s, null, 2);
}
function refreshAnalytics() {
  const total = allSessions.length;
  const verified = allSessions.filter((s) => s.verified).length;
  const escalated = allSessions.filter((s) => s.state === 'ESCALATE' || s.escalation).length;
  const contained = total === 0 ? 0 : Math.round(((total - escalated) / total) * 100);
  const intents = {};
  for (const s of allSessions) if (s.intent) intents[s.intent] = (intents[s.intent] || 0) + 1;
  const toolCounts = {};
  for (const s of allSessions) for (const tc of s.toolCalls) toolCounts[tc.tool] = (toolCounts[tc.tool] || 0) + 1;
  $('analytics').textContent = JSON.stringify({ totalSessions: total, verifiedSessions: verified, escalatedSessions: escalated, containmentRatePct: contained, intents, toolCalls: toolCounts }, null, 2);
}
function setupMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $('micBtn').title = 'Speech recognition not supported in this browser — type instead.'; return; }
  recognition = new SR();
  recognition.lang = $('langSelect').value === 'es' ? 'es-ES' : 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onresult = (e) => { inputEl.value = e.results[0][0].transcript; sendMessage(); };
  recognition.onend = () => { listening = false; $('micBtn').textContent = '🎤'; };
}
$('micBtn').onclick = () => {
  if (!recognition) { alert('Speech recognition is not supported in this browser. Please type instead.'); return; }
  if (listening) { recognition.stop(); return; }
  recognition.lang = $('langSelect').value === 'es' ? 'es-ES' : 'en-US';
  listening = true; $('micBtn').textContent = '🔴 Listening…';
  recognition.start();
};
$('callBtn').onclick = startCall;
$('endBtn').onclick = endCall;
$('transferBtn').onclick = transfer;
$('sendBtn').onclick = sendMessage;
$('summaryBtn').onclick = refreshSummary;
$('analyticsBtn').onclick = refreshAnalytics;
inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
$('langSelect').addEventListener('change', () => { if (recognition) recognition.lang = $('langSelect').value === 'es' ? 'es-ES' : 'en-US'; });
document.querySelectorAll('.demo-card').forEach((card) => {
  card.addEventListener('click', () => {
    const id = card.dataset.member;
    const dob = card.dataset.dob;
    const zip = card.dataset.zip;
    if (!currentSession) { startCall(); inputEl.value = id; sendMessage(); return; }
    inputEl.value = id;
    inputEl.focus();
    addBubble(`Demo hint — try: ${id}, then DOB ${dob}, then ZIP ${zip}`, 'system');
  });
});
setupMic();
