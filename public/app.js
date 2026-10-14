// Phone simulator — talks to /api/call/* . No API keys. Uses browser TTS + Web Speech if available.
let sessionId = null;
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
  // Prefer English / Spanish voice based on language selector
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
async function startCall() {
  sessionId = 'web-' + Math.random().toString(36).slice(2, 10);
  seconds = 0;
  $('timer').textContent = '00:00';
  timerId = setInterval(() => { seconds++; $('timer').textContent = fmtTimer(seconds); }, 1000);
  $('callStatus').textContent = 'On call — agent connected';
  $('callBtn').disabled = true; $('endBtn').disabled = false; $('transferBtn').disabled = false;
  inputEl.disabled = false; $('sendBtn').disabled = false;
  transcriptEl.innerHTML = '';
  $('escalationCard').hidden = true;
  $('suggested').innerHTML = '';
  const lang = $('langSelect').value;
  const res = await fetch('/api/call/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, language: lang }) });
  const reply = await res.json();
  addBubble(reply.reply, 'agent');
  speak(reply.reply);
  updateVerification(reply);
  renderToolCalls(reply.toolCalls);
  renderSuggested(reply.suggestedReplies);
}
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || !sessionId) return;
  addBubble(text, 'user');
  inputEl.value = '';
  $('typing').hidden = false;
  try {
    const res = await fetch('/api/call/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, text, language: $('langSelect').value }) });
    const reply = await res.json();
    $('typing').hidden = true;
    addBubble(reply.reply, 'agent');
    speak(reply.reply);
    updateVerification(reply);
    renderToolCalls(reply.toolCalls);
    renderSuggested(reply.suggestedReplies);
    if (reply.actions?.includes('END_CALL')) { /* keep UI open so user can see summary */ }
  } catch (e) {
    $('typing').hidden = true;
    addBubble('Connection error — is the server running? (npm run dev)', 'system');
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
async function transfer() {
  if (!sessionId) return;
  await fetch('/api/escalate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, reason: 'MANUAL' }) });
  addBubble('Connecting you to a representative. They will have your information and summary, so you will not need to repeat yourself.', 'agent');
  $('escalationCard').hidden = false;
  $('escalationBody').innerHTML = '<b>Reason:</b> MANUAL<br/>Manual transfer from demo UI.';
  refreshSummary();
}
async function refreshSummary() {
  if (!sessionId) return;
  const res = await fetch(`/api/call/summary/${sessionId}`);
  if (!res.ok) return;
  const s = await res.json();
  $('summary').textContent = JSON.stringify(s, null, 2);
}
async function refreshAnalytics() {
  const res = await fetch('/api/analytics');
  const a = await res.json();
  $('analytics').textContent = JSON.stringify(a, null, 2);
}

// Mic — Web Speech API with graceful fallback
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

// Demo cards — fill the next expected input
document.querySelectorAll('.demo-card').forEach((card) => {
  card.addEventListener('click', () => {
    const id = card.dataset.member;
    const dob = card.dataset.dob;
    const zip = card.dataset.zip;
    // If no call yet, start one
    if (!sessionId) { startCall().then(() => { inputEl.value = id; sendMessage(); }); return; }
    // Helper: user can copy values; we prefill the member ID
    inputEl.value = id;
    inputEl.focus();
    addBubble(`Demo hint — try: ${id}, then DOB ${dob}, then ZIP ${zip}`, 'system');
  });
});

setupMic();
