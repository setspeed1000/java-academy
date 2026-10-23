// Auto-checker. Each exercise task has tests; a task passes when all its tests pass.
// run = { code, compiled, serial, ev, trap, timedOut, harnessCompiled, harnessHint }

export function stripComments(code) {
  let out = '', i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i], d = code[i + 1];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && code[j] !== c && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
      out += code.slice(i, j + 1); i = j + 1; continue;
    }
    if (c === '/' && d === '/') { while (i < n && code[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

export function normalize(text) {
  return String(text || '').replace(/\r\n?/g, '\n')
    .split('\n').map(l => l.replace(/\s+$/, '')).join('\n')
    .replace(/\n+$/, '');
}

// ── Pin helpers ─────────────────────────────────────────────
export function pinHelpers(ev) {
  const writes = pin => ev.writes.filter(w => w.pin === pin);
  const digital = pin => writes(pin).filter(w => w.kind === 'D');
  const stateAt = (pin, t) => { let v = 0; for (const w of writes(pin)) { if (w.t <= t) v = w.v; else break; } return v; };
  const modeOf = pin => { const m = ev.modes[pin]; return m && m.length ? m[m.length - 1].mode : -1; };
  // Completed segments between changes: [{v, start, dur}]
  const segments = pin => {
    const ch = [];
    for (const w of digital(pin)) if (!ch.length || ch[ch.length - 1].v !== w.v) ch.push(w);
    const seg = [];
    for (let i = 0; i + 1 < ch.length; i++) seg.push({ v: ch[i].v, start: ch[i].t, dur: ch[i + 1].t - ch[i].t });
    return seg;
  };
  const toggles = pin => { let n = 0, last = null; for (const w of digital(pin)) { if (last !== null && w.v !== last) n++; last = w.v; } return n; };
  return { writes, digital, stateAt, modeOf, segments, toggles };
}

const MODE_NAMES = { 0: 'INPUT', 1: 'OUTPUT', 2: 'INPUT_PULLUP' };

function runTest(t, run, code, serial, h) {
  const ev = run.ev;
  switch (t.type) {
    case 'serial': {
      const exp = normalize(t.expected);
      if (serial === exp) return { ok: true };
      return { ok: false, why: (t.msg ? t.msg + '\n' : '') + 'Expected Serial output:\n' + exp + '\nYour output:\n' + (serial || '(nothing)') };
    }
    case 'serialIncludes':
      return serial.includes(t.text) ? { ok: true } : { ok: false, why: t.msg || ('Your Serial output should include: ' + t.text) };
    case 'serialRegex':
      return new RegExp(t.pattern, t.flags !== undefined ? t.flags : 'm').test(serial) ? { ok: true } : { ok: false, why: t.msg };
    case 'serialLines': {
      const n = serial ? serial.split('\n').length : 0;
      return n === t.count ? { ok: true } : { ok: false, why: t.msg || ('Expected ' + t.count + ' lines in the Serial Monitor, got ' + n + '.') };
    }
    case 'code':
      return new RegExp(t.pattern, t.flags || '').test(code) ? { ok: true } : { ok: false, why: t.msg };
    case 'notCode':
      return new RegExp(t.pattern, t.flags || '').test(code) ? { ok: false, why: t.msg } : { ok: true };
    case 'codeCount': {
      const m = code.match(new RegExp(t.pattern, 'g')) || [];
      return m.length >= t.min ? { ok: true } : { ok: false, why: t.msg };
    }
    case 'began':
      if (ev.baud === null) return { ok: false, why: t.msg || 'Start the Serial connection in setup before printing.' };
      if (t.baud && ev.baud !== t.baud) return { ok: false, why: 'Serial was started at ' + ev.baud + ' baud, but this exercise uses ' + t.baud + '.' };
      return { ok: true };
    case 'pinMode': {
      const m = h.modeOf(t.pin);
      if (m === t.mode) return { ok: true };
      return { ok: false, why: t.msg || ('Pin ' + t.pin + ' should be set to ' + MODE_NAMES[t.mode] + (m >= 0 ? ', but it was set to ' + MODE_NAMES[m] : ', but it was never set') + '.') };
    }
    case 'blink': {
      const seg = h.segments(t.pin);
      const tol = t.tol || 1;
      const highs = seg.filter(s => s.v === 1), lows = seg.filter(s => s.v === 0);
      const min = t.min || 2;
      if (highs.length + lows.length < min * 2 - 1) return { ok: false, why: t.msg || ('Pin ' + t.pin + ' should keep switching on and off. It switched ' + h.toggles(t.pin) + ' time(s).') };
      const badH = highs.find(s => Math.abs(s.dur - t.on) > tol), badL = lows.find(s => Math.abs(s.dur - t.off) > tol);
      if (badH) return { ok: false, why: 'Pin ' + t.pin + ' should stay on for ' + t.on + ' ms, but stayed on for ' + Math.round(badH.dur) + ' ms.' };
      if (badL) return { ok: false, why: 'Pin ' + t.pin + ' should stay off for ' + t.off + ' ms, but stayed off for ' + Math.round(badL.dur) + ' ms.' };
      return { ok: true };
    }
    case 'harness': {
      if (!run.harnessCompiled) return { ok: false, why: t.msg + (run.harnessHint ? ' ' + run.harnessHint : '') };
      const r = run.harnessResults && run.harnessResults[t.id];
      if (!r) return { ok: false, why: t.msg + (run.harnessTrap ? ' (your code crashed during the check)' : '') };
      return r.ok ? { ok: true } : { ok: false, why: t.msg + (r.detail ? ' (' + r.detail + ')' : '') };
    }
    case 'fn': {
      let r;
      try { r = t.fn(run, h, serial, code); } catch (e) { r = 'Check error: ' + e.message; }
      return r === true ? { ok: true } : { ok: false, why: typeof r === 'string' ? r : t.msg };
    }
    default:
      return { ok: false, why: 'Unknown test type ' + t.type };
  }
}

export function check(ex, run) {
  const code = stripComments(run.code || '');
  const serial = normalize(run.serial);
  const h = pinHelpers(run.ev || { writes: [], modes: {} });
  const tasks = (ex.tasks || []).map(task => {
    let ok = !!run.compiled, why = run.compiled ? '' : 'Your sketch needs to compile first.';
    if (ok) {
      for (const t of task.tests) {
        const r = runTest(t, run, code, serial, h);
        if (!r.ok) { ok = false; why = r.why; break; }
      }
    }
    return { text: task.text, ok, why };
  });
  return { tasks, passed: tasks.length > 0 && tasks.every(t => t.ok) };
}
