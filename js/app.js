import CURRICULUM from './lessons.js';
import { check, pinHelpers } from './checker.js';
import { buildSource, buildHarness, scenarioArg, parseEvents, normalizeSerial, compileArgs } from './sketch.js';
import { parseDiagnostics, WARNINGS, TRAPS, END_REASONS, esc } from './errors.js';

const $ = id => document.getElementById(id);

// ── Course data ──────────────────────────────────────────────
const EXERCISES = [];
CURRICULUM.forEach((u, ui) => u.exercises.forEach((ex, ei) => {
  ex.unit = u; ex.unitNum = ui + 1; ex.num = ei + 1;
  EXERCISES.push(ex);
}));
const SANDBOX = {
  id: 'sandbox', title: 'Sandbox', unit: { title: 'Free practice' }, unitNum: 0, tasks: [],
  learn: '<p>A blank board for experimenting. Nothing is checked here. Write any sketch, press Run, and watch the Serial Monitor and the Board.</p><p>Use the <strong>Inputs</strong> section on the Board tab to set a button on pin 2, a sensor on A0, and text typed into the Serial Monitor.</p>',
  starter: 'void setup() {\n  Serial.begin(9600);\n  pinMode(LED_BUILTIN, OUTPUT);\n}\n\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(500);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(500);\n}\n'
};
const byId = id => id === 'sandbox' ? SANDBOX : EXERCISES.find(e => e.id === id);

// ── Saved state ──────────────────────────────────────────────
const KEY = 'sketch-academy:v1';
const fresh = () => ({ done: {}, code: {}, attempts: {}, current: EXERCISES[0].id, view: 'serial', speed: 1,
  sandbox: { a0: 512, button: 'none', serial: '', seconds: 10 } });
let state = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.done) state = Object.assign(fresh(), s); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

// ── Editor ───────────────────────────────────────────────────
let editor;
const isMobile = () => window.matchMedia('(max-width: 760px)').matches;

function defineArduinoMode() {
  if (!window.CodeMirror) return 'text/x-c++src';
  const base = CodeMirror.resolveMode('text/x-c++src');
  const words = s => { const o = {}; s.split(' ').forEach(w => { o[w] = true; }); return o; };
  const extend = (orig, extra) => w => extra[w] || (typeof orig === 'function' ? orig(w) : !!(orig && orig.propertyIsEnumerable(w)));
  CodeMirror.defineMIME('text/x-arduino', Object.assign({}, base, {
    builtin: extend(base.builtin, words('Serial pinMode digitalWrite digitalRead analogRead analogWrite delay delayMicroseconds millis micros tone noTone random randomSeed map constrain min max abs sq sqrt pow setup loop attach write read')),
    atoms: extend(base.atoms, words('HIGH LOW INPUT OUTPUT INPUT_PULLUP LED_BUILTIN A0 A1 A2 A3 A4 A5 HEX DEC BIN OCT PI true false')),
    types: extend(base.types, words('byte boolean String word Servo'))
  }));
  return 'text/x-arduino';
}

function makeEditor() {
  const host = $('editorHost');
  if (window.CodeMirror) {
    editor = CodeMirror(host, {
      mode: defineArduinoMode(), theme: 'academy', lineNumbers: true, indentUnit: 2, tabSize: 2,
      indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true,
      inputStyle: 'contenteditable', spellcheck: false, autocorrect: false, autocapitalize: false,
      extraKeys: {
        'Tab': cm => cm.somethingSelected() ? cm.indentSelection('add') : cm.replaceSelection('  ', 'end'),
        'Shift-Tab': cm => cm.indentSelection('subtract'),
        'Ctrl-Enter': () => run(), 'Cmd-Enter': () => run(),
        'Ctrl-/': 'toggleComment', 'Cmd-/': 'toggleComment',
        'Ctrl-S': () => persistCode(), 'Cmd-S': () => persistCode()
      }
    });
  } else {
    const ta = document.createElement('textarea');
    ta.className = 'fallback-editor'; ta.spellcheck = false; host.appendChild(ta);
    const handlers = [];
    ta.addEventListener('input', () => handlers.forEach(h => h()));
    ta.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
      if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); }
    });
    editor = {
      getValue: () => ta.value, setValue: v => { ta.value = v; }, on: (ev, h) => handlers.push(h),
      focus: () => ta.focus(), refresh: () => {}, clearHistory: () => {}, addLineClass: () => {}, removeLineClass: () => {},
      setCursor: pos => { const lines = ta.value.split('\n'); let i = 0; for (let k = 0; k < pos.line; k++) i += lines[k].length + 1; ta.focus(); ta.setSelectionRange(i, i); },
      scrollIntoView: () => {}, lineCount: () => ta.value.split('\n').length
    };
  }
  let saveTimer;
  editor.on('change', () => { clearMarks(); clearTimeout(saveTimer); saveTimer = setTimeout(persistCode, 400); });
}

function persistCode() {
  if (!current) return;
  state.code[current.id] = editor.getValue();
  save();
}

let marked = [];
function clearMarks() {
  marked.forEach(([l, c]) => { try { editor.removeLineClass(l, 'background', c); } catch (e) {} });
  marked = [];
}
function markLine(n, cls) {
  const l = n - 1;
  if (l < 0 || l >= editor.lineCount()) return;
  editor.addLineClass(l, 'background', cls);
  marked.push([l, cls]);
}
function goToLine(n) {
  if (isMobile()) setTab('code');
  editor.focus();
  editor.setCursor({ line: n - 1, ch: 0 });
  editor.scrollIntoView({ line: n - 1, ch: 0 }, 80);
}

// ── Engine: compiler worker + per-run runner worker ──────────
let compiler = null, compilerReady = null, nextId = 1;
const pending = new Map();
let engineDead = false;

function startCompiler() {
  if (compiler) return compilerReady;
  if (typeof DecompressionStream === 'undefined') {
    engineFailed('This browser is too old to run the compiler. Use a recent Chrome, Edge, Firefox or Safari.');
    return Promise.reject(new Error('old browser'));
  }
  try {
    compiler = new Worker(new URL('./compiler-worker.js', import.meta.url), { type: 'module' });
  } catch (e) {
    engineFailed('Couldn\'t start the compiler: ' + e.message);
    return Promise.reject(e);
  }
  compilerReady = new Promise((resolve, reject) => {
    compiler.onmessage = e => {
      const m = e.data;
      if (m.type === 'progress') {
        if (m.total) setStatus('busy', 'Downloading the C++ compiler… ' + Math.floor(100 * m.done / m.total) + '%  (first visit only)');
      } else if (m.type === 'ready') resolve();
      else if (m.type === 'result') { const p = pending.get(m.id); pending.delete(m.id); p && p.resolve(m); }
      else if (m.type === 'fatal') {
        const p = pending.get(m.id);
        if (p) { pending.delete(m.id); p.reject(new Error(m.message)); }
        else reject(new Error(m.message));
      }
    };
    compiler.onerror = e => reject(new Error(e.message || 'Compiler worker failed to load'));
  });
  setStatus('busy', 'Loading the C++ compiler…');
  compiler.postMessage({ type: 'init' });
  compilerReady.then(() => { if (!running) setStatus('ok', 'Ready'); }, e => engineFailed(e.message));
  return compilerReady;
}

function compileSource(source) {
  return startCompiler().then(() => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    compiler.postMessage({ type: 'compile', id, source });
  }));
}

const RUN_TIMEOUT_MS = 6000;
function execute(wasm, args, onChunk) {
  return new Promise(resolve => {
    const w = new Worker(new URL('./runner-worker.js', import.meta.url), { type: 'module' });
    let stdout = '', stderr = '', done = false;
    const finish = r => { if (done) return; done = true; clearTimeout(timer); w.terminate(); resolve(Object.assign({ stdout, stderr }, r)); };
    const timer = setTimeout(() => finish({ code: -1, trap: { kind: 'timeout', message: 'No progress for ' + RUN_TIMEOUT_MS / 1000 + ' s' } }), RUN_TIMEOUT_MS);
    w.onmessage = e => {
      const m = e.data;
      if (m.type === 'out') { stdout += m.stdout; stderr += m.stderr; onChunk && onChunk(m.stdout); }
      if (m.type === 'done') finish({ code: m.code, trap: m.trap });
    };
    w.onerror = e => finish({ code: -1, trap: { kind: 'other', message: e.message } });
    w.postMessage({ wasm, args: [args] }, [wasm.buffer]);
  });
}

function engineFailed(msg) {
  engineDead = true;
  setStatus('err', 'Compiler failed to load');
  $('explain').innerHTML = '<div class="card err-card"><strong>The C++ compiler couldn\'t load.</strong>' +
    '<p>Check your connection and reload. The first visit downloads about 27 MB, then it\'s cached.</p>' +
    (msg ? '<pre class="err-src">' + esc(String(msg).slice(0, 600)) + '</pre>' : '') + '</div>';
}

// ── Status / output UI ───────────────────────────────────────
function setStatus(kind, text) {
  $('status').className = 'status ' + (kind || '');
  $('statusText').textContent = text;
}

let rawLog = [];
function logRaw(cmd, text, exit) {
  rawLog.push('$ ' + cmd + '\n' + (text || '') + (text && !text.endsWith('\n') ? '\n' : '') + '[exit code ' + exit + ']');
  $('rawOut').textContent = rawLog.join('\n\n');
}

function clearOutput() {
  $('out').textContent = '';
  $('out').classList.remove('has-error');
  $('explain').innerHTML = '';
  $('banner').hidden = true;
  rawLog = [];
  $('rawOut').textContent = '(Run your sketch to see the raw output of every step.)';
}

function setView(v) {
  state.view = v; save();
  document.querySelectorAll('.out-tab').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  $('viewSerial').hidden = v !== 'serial';
  $('viewBoard').hidden = v !== 'board';
  $('viewRaw').hidden = v !== 'raw';
  if (v === 'board' && lastRun && !replayedThisRun) startReplay();
}

function showDiagnostics(diags) {
  if (!diags.length) return;
  diags.forEach(d => d.line && markLine(d.line, d.severity === 'error' ? 'cm-error-line' : 'cm-warn-line'));
  const errs = diags.filter(d => d.severity === 'error'), warns = diags.filter(d => d.severity === 'warning');
  const shown = errs.length ? errs.slice(0, 4) : warns.slice(0, 4);
  const title = errs.length ? (errs.length === 1 ? '1 error' : errs.length + ' errors') + ', explained'
    : (warns.length === 1 ? '1 warning' : warns.length + ' warnings') + ' (it still ran, but check these)';
  $('explain').insertAdjacentHTML('beforeend',
    '<h3 class="explain-title">' + title + '</h3>' +
    shown.map(d =>
      '<div class="card ' + (d.severity === 'error' ? 'err-card' : 'warn-card') + '">' +
        '<div class="err-head">' + (d.line ? '<button class="line-link" data-line="' + d.line + '">Line ' + d.line + '</button>' : '') +
        '<span class="err-msg">' + esc(d.message) + '</span></div>' +
        (d.source ? '<pre class="err-src">' + esc(d.source.trim()) + '</pre>' : '') +
        (d.explanation ? '<p>' + d.explanation + '</p>' : '<p>Read the message and look at the line it points to.</p>') +
      '</div>').join('') +
    (errs.length > 1 ? '<p class="muted">Tip: fix the <strong>first</strong> error and run again. Later errors are often side effects of it.</p>' : ''));
}

function showRunNotes(ev, trap) {
  const notes = [];
  if (trap) {
    const msg = trap.kind === 'timeout'
      ? 'Your sketch got stuck in a loop that never waits, prints or reads anything, so simulated time couldn\'t move forward. Check your <code>while</code> loops and their conditions.'
      : TRAPS[trap.kind] || TRAPS.other;
    notes.push('<div class="card err-card"><div class="err-head"><span class="err-msg">' + (trap.kind === 'timeout' ? 'Stuck' : 'Crashed') + '</span></div><p>' + msg + '</p></div>');
  }
  ev.warnings.forEach(w => { const f = WARNINGS[w.code]; if (f) notes.push('<div class="card warn-card"><p>' + f(w.pin) + '</p></div>'); });
  if (ev.end && ev.end.reason !== 'time') notes.push('<div class="card warn-card"><p>' + END_REASONS[ev.end.reason](ev.end.t) + '</p></div>');
  if (notes.length) $('explain').insertAdjacentHTML('beforeend', notes.join(''));
}

$('explain').addEventListener('click', e => { const b = e.target.closest('.line-link'); if (b) goToLine(+b.dataset.line); });

function showBanner(kind, html) {
  const b = $('banner');
  b.className = 'banner ' + kind;
  b.innerHTML = html;
  b.hidden = false;
}

// ── Tasks ────────────────────────────────────────────────────
function renderTasks(results) {
  const done = !results && state.done[current.id];
  $('taskList').innerHTML = current.tasks.map((t, i) => {
    const r = results && results[i];
    const cls = r ? (r.ok ? 'ok' : 'fail') : (done ? 'ok' : '');
    const why = r && !r.ok && r.why ? '<div class="why">' + esc(r.why) + '</div>' : '';
    return '<li class="task ' + cls + '"><span class="tick" aria-hidden="true"></span><div class="task-body"><div class="task-text">' + t.text + '</div>' + why + '</div></li>';
  }).join('');
  let shown = false;
  $('taskList').querySelectorAll('.task.fail .why').forEach(w => { if (shown) w.remove(); else shown = true; });
}

function updateHelp() {
  const a = state.attempts[current.id] || 0;
  $('solutionBtn').hidden = !current.solution || !(a >= 2 || state.done[current.id]);
}

// ── Scenario (simulated inputs) ──────────────────────────────
function scenarioFor(ex) {
  if (ex.id !== 'sandbox') return ex.scenario || {};
  const s = state.sandbox;
  const sc = { limit: s.seconds * 1000, analog: [[0, 0, s.a0]], digital: [] };
  if (s.button === 'held') sc.digital.push([2, 0, 0]);
  if (s.button === 'press') sc.digital.push([2, 0, 1], [2, 2000, 0], [2, 4000, 1]);
  if (s.serial) sc.serial = [[1000, s.serial + '\n']];
  return sc;
}

// ── Run ──────────────────────────────────────────────────────
let running = false, lastRun = null, replayedThisRun = false;

async function run() {
  if (running) return;
  if (engineDead) { location.reload(); return; }
  running = true;
  $('runBtn').disabled = true;
  persistCode();
  clearMarks(); clearOutput(); stopReplay();
  if (isMobile()) setTab('output');
  const ex = current;
  const code = editor.getValue();
  const sc = scenarioFor(ex);
  const started = performance.now();
  const runInfo = { code, compiled: false, serial: '', ev: parseEvents(''), harnessCompiled: false, harnessResults: {} };

  try {
    setStatus('busy', compiler && !compilerReady ? 'Compiling…' : 'Compiling…');
    const c = await compileSource(buildSource(code));
    logRaw(compileArgs().join(' '), c.log, c.ok ? 0 : 1);
    const diags = parseDiagnostics(c.log);
    if (!c.ok) {
      $('out').textContent = c.log;
      $('out').classList.add('has-error');
      showDiagnostics(diags);
      setStatus('err', 'Didn\'t compile');
      if (!state.view || state.view === 'board') setView('serial');
      finish(ex, runInfo);
      return;
    }
    runInfo.compiled = true;
    showDiagnostics(diags);

    setStatus('busy', 'Running on the simulated board…');
    const args = scenarioArg(sc);
    const out = $('out');
    const r = await execute(c.wasm, args, chunk => { out.textContent += normalizeSerial(chunk); });
    logRaw('run sketch.wasm "' + args + '"', '--- Serial Monitor (stdout) ---\n' + r.stdout + '\n--- Board events (stderr) ---\n' + r.stderr, r.code);
    runInfo.serial = normalizeSerial(r.stdout);
    runInfo.ev = parseEvents(r.stderr);
    runInfo.trap = r.trap;
    out.textContent = runInfo.serial;
    if (!runInfo.serial) out.innerHTML = '<span class="muted">(Nothing was printed to the Serial Monitor.)</span>';
    showRunNotes(runInfo.ev, r.trap);
    lastRun = { ev: runInfo.ev, sc, trap: r.trap };
    replayedThisRun = false;
    renderBoard();
    if (state.view === 'board') startReplay();

    if (ex.harness) {
      setStatus('busy', 'Checking…');
      const hc = await compileSource(buildHarness(code, ex));
      logRaw(compileArgs().join(' ') + '   (hidden checker tests)', hc.log, hc.ok ? 0 : 1);
      runInfo.harnessCompiled = hc.ok;
      if (hc.ok) {
        const hargs = scenarioArg(sc, true);
        const hr = await execute(hc.wasm, hargs);
        logRaw('run checker.wasm "' + hargs + '"', '--- stdout ---\n' + hr.stdout + '\n--- results (stderr) ---\n' + hr.stderr, hr.code);
        runInfo.harnessResults = parseEvents(hr.stderr).results;
        runInfo.harnessTrap = hr.trap;
      } else runInfo.harnessHint = 'The checker couldn\'t find ' + ex.harness.signature + '. Check the names, capitals and types.';
    }
    const simT = runInfo.ev.end ? (runInfo.ev.end.t / 1000).toFixed(1) + ' s simulated' : '';
    setStatus(r.trap ? 'err' : 'ok', (r.trap ? (r.trap.kind === 'timeout' ? 'Stuck' : 'Crashed') : 'Done') +
      ' in ' + ((performance.now() - started) / 1000).toFixed(1) + ' s' + (simT ? ' · ' + simT : ''));
    finish(ex, runInfo);
  } catch (e) {
    if (!engineDead) { setStatus('err', 'Something went wrong'); $('explain').innerHTML = '<pre class="err-src">' + esc(String(e && e.stack || e)) + '</pre>'; }
  } finally {
    running = false;
    $('runBtn').disabled = false;
    $('outDot').hidden = !isMobile() || $('workspace').dataset.tab === 'output';
  }
}

function finish(ex, runInfo) {
  if (ex !== current || !ex.tasks.length) return;
  const result = check(ex, runInfo);
  renderTasks(result.tasks);
  if (result.passed) {
    const first = !state.done[ex.id];
    state.done[ex.id] = true; save();
    const next = EXERCISES[EXERCISES.indexOf(ex) + 1];
    showBanner('pass', '<strong>All checks passed.</strong> ' + (first ? 'Exercise complete.' : 'Still correct.') +
      (next ? ' <button class="btn small" id="bannerNext">Next exercise</button>' : ' That\'s the whole course. Try the Sandbox.'));
    const bn = $('bannerNext');
    if (bn) bn.onclick = () => go(next.id);
    updateProgress(); renderDrawer(); updateNav();
  } else {
    state.attempts[ex.id] = (state.attempts[ex.id] || 0) + 1; save();
    const n = result.tasks.filter(t => t.ok).length;
    showBanner('fail', runInfo.compiled
      ? '<strong>' + n + ' of ' + result.tasks.length + ' tasks done.</strong> See the instructions for what\'s still missing.'
      : '<strong>Your sketch needs to compile first.</strong> Fix the error below.');
  }
  updateHelp();
}

// ── Board view ───────────────────────────────────────────────
const PWM_PINS = [3, 5, 6, 9, 10, 11];
const pinName = p => p >= 14 && p <= 19 ? 'A' + (p - 14) : String(p);

function boardModel() {
  const { ev, sc } = lastRun;
  const pins = new Map();
  const get = p => { if (!pins.has(p)) pins.set(p, { pin: p, out: null, inputD: [], inputA: [] }); return pins.get(p); };
  Object.keys(ev.modes).forEach(p => { const m = ev.modes[p]; const e = get(+p); e.mode = m[m.length - 1].mode; });
  ev.writes.forEach(w => { const e = get(w.pin); e.out = e.out === 'pwm' || w.kind === 'A' ? 'pwm' : 'digital'; });
  ev.servos.forEach(s => { get(s.pin).out = 'servo'; });
  ev.tones.forEach(t => { get(t.pin).out = 'tone'; });
  (sc.digital || []).forEach(([p, t, v]) => get(+p).inputD.push({ t, v }));
  (sc.analog || []).forEach(([p, t, v]) => get(+p < 6 ? +p + 14 : +p).inputA.push({ t, v }));
  Object.keys(ev.reads).forEach(p => { get(+p).read = ev.reads[p]; });
  const list = [...pins.values()].filter(e => e.out || e.read || e.inputD.length || e.inputA.length || e.mode === 1);
  list.sort((a, b) => a.pin - b.pin);
  return list;
}

function duration() {
  const { ev, sc } = lastRun;
  if (ev.end) return ev.end.t;
  const last = Math.max(0, ...ev.writes.map(w => w.t), ...ev.servos.map(s => s.t), ...ev.tones.map(t => t.t));
  return Math.max(last + 500, 1000);
}

function inputAt(arr, t, dflt) { let v = dflt; for (const x of arr) if (x.t <= t) v = x.v; return v; }

function renderBoard() {
  if (!lastRun) return;
  const model = boardModel();
  $('replayBtn').disabled = false;
  if (!model.length) {
    $('pins').innerHTML = '<p class="muted">This sketch didn\'t use any pins.</p>';
    $('timeline').innerHTML = '';
  } else {
    $('pins').innerHTML = model.map(e => {
      const label = 'Pin ' + pinName(e.pin) + (e.pin === 13 ? ' · LED_BUILTIN' : '');
      let body = '';
      if (e.out === 'servo') body = '<div class="servo"><div class="servo-arm" data-servo="' + e.pin + '"></div></div><span class="pin-val" data-val="' + e.pin + '">–</span>';
      else if (e.out === 'tone') body = '<div class="buzzer" data-tone="' + e.pin + '"></div><span class="pin-val" data-val="' + e.pin + '">off</span>';
      else if (e.out) body = '<div class="led" data-led="' + e.pin + '"></div><span class="pin-val" data-val="' + e.pin + '">LOW</span>';
      else if (e.inputA.length || e.pin >= 14) body = '<div class="meter"><div class="meter-fill" data-meter="' + e.pin + '"></div></div><span class="pin-val" data-val="' + e.pin + '">0</span>';
      else body = '<div class="button-ind" data-btn="' + e.pin + '"></div><span class="pin-val" data-val="' + e.pin + '">–</span>';
      const kind = e.out === 'servo' ? 'servo' : e.out === 'tone' ? 'tone' : e.out === 'pwm' ? 'PWM out' : e.out ? 'output' : e.mode === 2 ? 'input (pull-up)' : 'input';
      return '<div class="pin-card"><div class="pin-label">' + label + '</div><div class="pin-kind">' + kind + '</div><div class="pin-body">' + body + '</div></div>';
    }).join('');
    renderTimeline(model);
  }
  renderInputs();
  paintAt(0);
}

function renderTimeline(model) {
  const { ev } = lastRun;
  const T = duration();
  const W = 1000, H = 20;
  const x = t => (Math.min(t, T) / T) * W;
  const rows = model.map(e => {
    let pts = [], v = 0;
    const step = (t, nv) => { if (!pts.length && t <= 0) { v = nv; return; } pts.push([x(t), v]); pts.push([x(t), nv]); v = nv; };
    if (e.out === 'servo') ev.servos.filter(s => s.pin === e.pin).forEach(s => step(s.t, s.angle / 180));
    else if (e.out === 'tone') ev.tones.filter(s => s.pin === e.pin).forEach(s => step(s.t, s.hz ? 1 : 0));
    else if (e.out) ev.writes.filter(w => w.pin === e.pin).forEach(w => step(w.t, w.kind === 'A' ? w.v / 255 : w.v));
    else if (e.inputA.length) { v = 0; e.inputA.forEach(a => step(a.t, a.v / 1023)); }
    else { v = e.mode === 2 ? 1 : 0; e.inputD.forEach(d => step(d.t, d.v)); }
    pts.unshift([0, pts.length ? pts[0][1] : v]);
    pts.push([W, v]);
    const d = pts.map(([px, pv], k) => (k ? 'L' : 'M') + px.toFixed(1) + ' ' + (H - 1 - pv * (H - 2)).toFixed(1)).join(' ');
    return '<div class="tl-row"><span class="tl-label">' + pinName(e.pin) + '</span>' +
      '<svg class="tl-wave" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + d + '" class="' + (e.out ? 'wave-out' : 'wave-in') + '"/></svg></div>';
  }).join('');
  const fmt = v => (v < 10 ? v.toFixed(1) : v.toFixed(0)) + ' s';
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => '<span>' + fmt(f * T / 1000) + '</span>').join('');
  $('timeline').innerHTML = '<div class="tl" id="tl">' + rows + '<div class="tl-axis">' + ticks + '</div><div class="tl-playhead"></div></div>';
}

function paintAt(t) {
  if (!lastRun) return;
  const { ev } = lastRun;
  const h = pinHelpers(ev);
  const model = boardModel();
  model.forEach(e => {
    const val = document.querySelector('[data-val="' + e.pin + '"]');
    if (e.out === 'servo') {
      let a = null; for (const s of ev.servos) if (s.pin === e.pin && s.t <= t) a = s.angle;
      const arm = document.querySelector('[data-servo="' + e.pin + '"]');
      if (arm) arm.style.transform = 'rotate(' + ((a === null ? 90 : a) - 90) + 'deg)';
      if (val) val.textContent = a === null ? '–' : a + '°';
    } else if (e.out === 'tone') {
      let hz = 0; for (const s of ev.tones) if (s.pin === e.pin && s.t <= t) hz = s.hz;
      const bz = document.querySelector('[data-tone="' + e.pin + '"]');
      if (bz) bz.classList.toggle('on', hz > 0);
      if (val) val.textContent = hz ? hz + ' Hz' : 'off';
    } else if (e.out) {
      const w = h.writes(e.pin).filter(x => x.t <= t).pop();
      const level = !w ? 0 : w.kind === 'A' ? w.v / 255 : w.v;
      const led = document.querySelector('[data-led="' + e.pin + '"]');
      if (led) { led.style.setProperty('--glow', level); led.classList.toggle('on', level > 0); }
      if (val) val.textContent = !w ? 'LOW' : w.kind === 'A' ? 'PWM ' + w.v : (w.v ? 'HIGH' : 'LOW');
    } else if (e.inputA.length || e.pin >= 14) {
      const v = inputAt(e.inputA, t, 0);
      const m = document.querySelector('[data-meter="' + e.pin + '"]');
      if (m) m.style.width = (100 * v / 1023) + '%';
      if (val) val.textContent = v;
    } else {
      const v = inputAt(e.inputD, t, e.mode === 2 ? 1 : 0);
      const b = document.querySelector('[data-btn="' + e.pin + '"]');
      const pressed = e.mode === 2 ? v === 0 : v === 1;
      if (b) b.classList.toggle('pressed', pressed);
      if (val) val.textContent = (v ? 'HIGH' : 'LOW') + (pressed ? ' · pressed' : '');
    }
  });
  const T = duration();
  const tl = $('tl');
  if (tl) tl.style.setProperty('--f', String(Math.min(t, T) / T));
  $('simClock').textContent = 't = ' + (t / 1000).toFixed(2) + ' s / ' + (T / 1000).toFixed(2) + ' s';
}

let raf = 0;
function startReplay() {
  if (!lastRun) return;
  stopReplay();
  replayedThisRun = true;
  const T = duration(), speed = +state.speed || 1;
  const t0 = performance.now();
  const frame = () => {
    const t = (performance.now() - t0) * speed;
    paintAt(Math.min(t, T));
    if (t < T) raf = requestAnimationFrame(frame); else raf = 0;
  };
  raf = requestAnimationFrame(frame);
}
function stopReplay() { if (raf) cancelAnimationFrame(raf); raf = 0; }

function renderInputs() {
  const panel = $('inputsPanel');
  if (current.id !== 'sandbox') {
    panel.hidden = !current.inputs;
    panel.innerHTML = current.inputs ? '<h3>Simulated inputs</h3><p>' + current.inputs + '</p>' : '';
    return;
  }
  const s = state.sandbox;
  panel.hidden = false;
  panel.innerHTML = '<h3>Inputs (Sandbox)</h3>' +
    '<label>Sensor on A0 <input type="range" min="0" max="1023" id="inA0" value="' + s.a0 + '"> <span id="inA0v">' + s.a0 + '</span></label>' +
    '<label>Button on pin 2 (wire it with INPUT_PULLUP) <select id="inBtn">' +
      [['none', 'not pressed'], ['held', 'held down the whole time'], ['press', 'pressed from 2 s to 4 s']].map(([v, l]) => '<option value="' + v + '"' + (s.button === v ? ' selected' : '') + '>' + l + '</option>').join('') +
    '</select></label>' +
    '<label>Typed into Serial Monitor at 1 s <input type="text" id="inSer" value="' + esc(s.serial) + '" placeholder="e.g. 42"></label>' +
    '<label>Run for <select id="inSec">' + [5, 10, 30].map(n => '<option' + (s.seconds === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select> seconds</label>' +
    '<p class="muted">Changes apply the next time you press Run.</p>';
  $('inA0').oninput = e => { s.a0 = +e.target.value; $('inA0v').textContent = s.a0; save(); };
  $('inBtn').onchange = e => { s.button = e.target.value; save(); };
  $('inSer').oninput = e => { s.serial = e.target.value; save(); };
  $('inSec').onchange = e => { s.seconds = +e.target.value; save(); };
}

// ── Navigation / rendering ───────────────────────────────────
let current = null;
function go(id) { if (location.hash !== '#' + id) location.hash = id; else load(id); }

let solutionView = null;
function showSolution(on) {
  $('solutionBox').hidden = !on;
  $('solutionBtn').textContent = on ? 'Hide solution' : 'View solution';
  if (!on) return;
  if (!solutionView) {
    if (window.CodeMirror) {
      solutionView = CodeMirror($('solutionCode'), { mode: 'text/x-arduino', theme: 'academy', lineNumbers: true, readOnly: 'nocursor', viewportMargin: Infinity, tabSize: 2 });
    } else {
      const pre = document.createElement('pre');
      $('solutionCode').appendChild(pre);
      solutionView = { setValue: v => { pre.textContent = v; }, refresh: () => {} };
    }
  }
  solutionView.setValue(current.solution);
  setTimeout(() => solutionView.refresh(), 0);
  $('solutionBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function load(id) {
  const ex = byId(id) || EXERCISES[0];
  if (current) persistCode();
  clearMarks(); stopReplay();
  current = ex;
  state.current = ex.id; save();

  $('unitLabel').textContent = ex.unitNum ? 'Unit ' + ex.unitNum + ' · ' + ex.unit.title : ex.unit.title;
  $('exTitle').textContent = ex.title;
  $('crumb').innerHTML = ex.unitNum ? '<span>' + esc(ex.unit.title) + '</span><span class="sep">/</span><strong>' + esc(ex.title) + '</strong>' : '<strong>Sandbox</strong>';
  $('learnBody').innerHTML = ex.learn;
  $('instructionsBox').hidden = !ex.tasks.length;
  $('scenarioBox').hidden = !ex.inputs;
  $('scenarioBox').innerHTML = ex.inputs ? '<strong>Simulated inputs:</strong> ' + ex.inputs : '';
  $('hintBox').hidden = true;
  $('hintBox').innerHTML = ex.hint || '';
  $('hintBtn').textContent = 'Get a hint';
  $('solutionBox').hidden = true;
  $('solutionBtn').textContent = 'View solution';
  renderTasks();
  updateHelp();

  editor.setValue(state.code[ex.id] != null ? state.code[ex.id] : ex.starter);
  editor.clearHistory();
  clearMarks(); clearOutput();
  lastRun = null;
  $('pins').innerHTML = '<p class="muted">Run your sketch to see the board.</p>';
  $('timeline').innerHTML = '';
  $('replayBtn').disabled = true;
  $('simClock').textContent = 't = 0.00 s';
  renderInputs();
  if (!running && compilerReady && !engineDead) setStatus('ok', 'Ready');
  if (state.done[ex.id] && ex.tasks.length) showBanner('pass', '<strong>Completed.</strong> Run again any time, or move on.');

  updateNav(); renderDrawer(); closeDrawer();
  $('paneLearn').querySelector('.learn-scroll').scrollTop = 0;
  if (isMobile()) setTab('learn');
  document.title = ex.title + ' · Sketch Academy';
}

function updateNav() {
  const i = EXERCISES.indexOf(current);
  $('prevBtn').disabled = i <= 0;
  $('nextBtn').disabled = i === EXERCISES.length - 1 || i < 0;
  $('nextBtn').classList.toggle('primary', !!state.done[current.id]);
  $('exCount').textContent = i >= 0 ? (i + 1) + ' / ' + EXERCISES.length : '';
}

function updateProgress() {
  const n = EXERCISES.filter(e => state.done[e.id]).length;
  $('progressFill').style.width = (100 * n / EXERCISES.length) + '%';
  $('progressText').textContent = n + ' / ' + EXERCISES.length;
}

const CHECK_SVG = '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function renderDrawer() {
  $('drawerBody').innerHTML = CURRICULUM.map((u, ui) => {
    const done = u.exercises.filter(e => state.done[e.id]).length;
    return '<div class="d-unit"><div class="d-unit-head"><span>Unit ' + (ui + 1) + ' · ' + esc(u.title) + '</span><span class="d-count">' + done + '/' + u.exercises.length + '</span></div>' +
      u.exercises.map(e =>
        '<button class="d-ex' + (state.done[e.id] ? ' done' : '') + (current && current.id === e.id ? ' current' : '') + '" data-id="' + e.id + '">' +
        '<span class="d-tick">' + (state.done[e.id] ? CHECK_SVG : '') + '</span><span>' + esc(e.title) + '</span></button>').join('') +
      '</div>';
  }).join('') +
    '<div class="d-unit"><div class="d-unit-head"><span>Extras</span></div><button class="d-ex' + (current && current.id === 'sandbox' ? ' current' : '') + '" data-id="sandbox"><span class="d-tick"></span><span>Sandbox</span></button></div>';
}

function openDrawer() { $('drawer').classList.add('open'); $('drawer').setAttribute('aria-hidden', 'false'); $('scrim').hidden = false; }
function closeDrawer() { $('drawer').classList.remove('open'); $('drawer').setAttribute('aria-hidden', 'true'); $('scrim').hidden = true; }

function setTab(tab) {
  $('workspace').dataset.tab = tab;
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'output') { $('outDot').hidden = true; if (state.view === 'board' && lastRun && !replayedThisRun) startReplay(); }
  if (tab === 'code') setTimeout(() => editor.refresh(), 0);
}

// ── Wire up ──────────────────────────────────────────────────
makeEditor();
$('runBtn').onclick = run;
$('menuBtn').onclick = openDrawer;
$('closeDrawer').onclick = closeDrawer;
$('scrim').onclick = closeDrawer;
$('drawerBody').addEventListener('click', e => { const b = e.target.closest('.d-ex'); if (b) go(b.dataset.id); });
$('prevBtn').onclick = () => { const i = EXERCISES.indexOf(current); if (i > 0) go(EXERCISES[i - 1].id); };
$('nextBtn').onclick = () => { const i = EXERCISES.indexOf(current); if (i >= 0 && i < EXERCISES.length - 1) go(EXERCISES[i + 1].id); };
$('hintBtn').onclick = () => { const h = $('hintBox'); h.hidden = !h.hidden; $('hintBtn').textContent = h.hidden ? 'Get a hint' : 'Hide hint'; };
$('solutionBtn').onclick = () => showSolution($('solutionBox').hidden);
$('resetBtn').onclick = () => { if (confirm('Reset this exercise to the starter code?')) { editor.setValue(current.starter); persistCode(); clearOutput(); } };
$('resetAll').onclick = () => {
  if (confirm('Erase all progress and saved code? This can\'t be undone.')) {
    state = fresh(); save(); current = null;
    updateProgress(); go(EXERCISES[0].id);
  }
};
document.querySelectorAll('.out-tab').forEach(b => b.onclick = () => setView(b.dataset.view));
$('replayBtn').onclick = startReplay;
$('speedSel').value = String(state.speed || 1);
$('speedSel').onchange = e => { state.speed = +e.target.value; save(); };
document.querySelectorAll('#tabbar button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
  if (e.key === 'Escape') closeDrawer();
});
window.addEventListener('hashchange', () => load(location.hash.slice(1)));
window.addEventListener('resize', () => editor.refresh());
window.addEventListener('beforeunload', persistCode);

updateProgress();
const start = location.hash.slice(1);
load(byId(start) ? start : state.current);
setView(state.view || 'serial');
startCompiler().catch(() => {});
