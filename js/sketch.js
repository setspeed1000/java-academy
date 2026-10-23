// Turns a sketch into a compilable C++ file, builds hidden-test harnesses, and parses run output.
// Shared by the browser and by tools/verify.mjs.

export const SKETCH = 'sketch.ino';

export const COMPILE_FLAGS = [
  '-std=gnu++11', '-O0', '-fno-exceptions', '-fno-rtti', '-I.',
  '-Werror=return-type', '-ferror-limit=20', '-fno-color-diagnostics'
];

export function compileArgs() {
  return ['clang++', ...COMPILE_FLAGS, 'build.cpp', 'core.o', '-o', 'sketch.wasm'];
}

// Replace comments, string/char contents and preprocessor lines with spaces (same length),
// so braces and semicolons can be counted safely.
function blank(code) {
  const out = code.split('');
  const n = code.length;
  let i = 0, lineStart = true;
  const wipe = (a, b) => { for (let k = a; k < b && k < n; k++) if (out[k] !== '\n') out[k] = ' '; };
  while (i < n) {
    const c = code[i], d = code[i + 1];
    if (c === '\n') { lineStart = true; i++; continue; }
    if (lineStart && c === '#') {
      let j = i;
      while (j < n && !(code[j] === '\n' && code[j - 1] !== '\\')) j++;
      wipe(i, j); i = j; continue;
    }
    if (c !== ' ' && c !== '\t') lineStart = false;
    if (c === '/' && d === '/') { let j = i; while (j < n && code[j] !== '\n') j++; wipe(i, j); i = j; continue; }
    if (c === '/' && d === '*') { let j = i + 2; while (j < n && !(code[j] === '*' && code[j + 1] === '/')) j++; wipe(i, j + 2); i = j + 2; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && code[j] !== c && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
      wipe(i + 1, j); i = j + 1; continue;
    }
    i++;
  }
  return out.join('');
}

const NOT_FUNCS = /^(if|else|while|for|switch|do|return|sizeof|case|new|delete)$/;

function protoFromHead(head) {
  const h = head.replace(/\s+/g, ' ').trim();
  if (!h || /^(class|struct|union|enum|namespace|typedef|template|extern)\b/.test(h)) return null;
  if (h.includes('=') || h.includes('::') || /\boperator\b/.test(h)) return null;
  const m = h.match(/^([A-Za-z_][\w\s\*&<>,]*?[\w\*&>])\s*\b([A-Za-z_]\w*)\s*\(([^()]*)\)\s*(const)?$/);
  if (!m) return null;
  const type = m[1].trim(), name = m[2];
  if (NOT_FUNCS.test(name) || NOT_FUNCS.test(type) || /\b(return|else)\b/.test(type)) return null;
  return { name, proto: (name === 'setup' || name === 'loop' || name === 'main') ? null : h + ';' };
}

// Like the Arduino IDE: declare every function up front so they can be called before they are defined.
export function addPrototypes(code) {
  const clean = blank(code);
  const n = clean.length;
  let depth = 0, paren = 0, stmtStart = 0;
  const found = [];
  for (let i = 0; i < n; i++) {
    const c = clean[i];
    if (depth === 0) {
      if (c === '(') paren++;
      else if (c === ')') paren = Math.max(0, paren - 1);
      else if (c === ';') stmtStart = i + 1;
      else if (c === '{' && paren === 0) {
        const head = clean.slice(stmtStart, i);
        const fn = protoFromHead(head);
        if (fn) found.push({ proto: fn.proto, start: stmtStart + (head.length - head.trimStart().length) });
        depth = 1;
      } else if (c === '}') stmtStart = i + 1;
    } else {
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) stmtStart = i + 1; }
    }
  }
  const protos = found.map(f => f.proto).filter(Boolean);
  if (!protos.length) return { code, prototypes: [] };
  const lines = code.split('\n');
  const line = code.slice(0, found[0].start).split('\n').length - 1;   // 0-based line of first function
  lines.splice(line, 0, ...protos, '#line ' + (line + 1) + ' "' + SKETCH + '"');
  return { code: lines.join('\n'), prototypes: protos };
}

export function buildSource(code) {
  return '#include "Arduino.h"\n#line 1 "' + SKETCH + '"\n' + addPrototypes(code).code + '\n';
}

export function buildHarness(code, ex) {
  if (!ex.harness) return null;
  const body = ex.harness.tests.map(t =>
    '  { ' + (t.pre || '') + ' academy_report("' + t.id + '", (' + t.cpp + '), ' +
    (t.got ? 'academy_fmt(' + t.got + ')' : 'String("")') + '); }'
  ).join('\n');
  return buildSource(code) + '#line 1 "checker"\nextern "C" void academy_test_main() {\n' + body + '\n}\n';
}

// Scenario → argv string for the core (see core.cpp parse_config).
export function scenarioArg(sc = {}, test = false) {
  const parts = ['limit=' + (sc.limit || 10000)];
  (sc.digital || []).forEach(([pin, t, v]) => parts.push('D:' + pin + ':' + t + ':' + v));
  (sc.analog || []).forEach(([pin, t, v]) => parts.push('A:' + pin + ':' + t + ':' + v));
  (sc.serial || []).forEach(([t, text]) => parts.push('S:' + t + ':' + encodeURIComponent(text)));
  if (sc.seed) parts.push('seed=' + sc.seed);
  if (test) parts.push('test');
  return parts.join(';');
}

// Parse the event stream (stderr) produced by the simulated core.
export function parseEvents(text) {
  const ev = { modes: {}, writes: [], tones: [], servos: [], baud: null, beganAt: null, reads: {}, warnings: [], end: null, results: {} };
  String(text || '').split('\n').forEach(line => {
    let m;
    if ((m = line.match(/^(PASS|FAIL) (\S+)(?: :: (.*))?$/))) { ev.results[m[2]] = { ok: m[1] === 'PASS', detail: m[3] || '' }; return; }
    const p = line.split(' ');
    const num = k => Number(p[k]);
    switch (p[0]) {
      case 'M': (ev.modes[num(1)] = ev.modes[num(1)] || []).push({ mode: num(2), t: num(3) / 1000 }); break;
      case 'D': ev.writes.push({ pin: num(1), v: num(2), t: num(3) / 1000, kind: 'D' }); break;
      case 'A': ev.writes.push({ pin: num(1), v: num(2), t: num(3) / 1000, kind: 'A' }); break;
      case 'T': ev.tones.push({ pin: num(1), hz: num(2), t: num(3) / 1000 }); break;
      case 'V': ev.servos.push({ pin: num(1), angle: num(2), t: num(3) / 1000 }); break;
      case 'B': if (ev.baud === null) { ev.baud = num(1); ev.beganAt = num(2) / 1000; } break;
      case 'R': ev.reads[num(1)] = num(2); break;
      case 'w': ev.warnings.push({ code: p[1], pin: num(2) }); break;
      case 'X': ev.end = { reason: p[1], t: num(2) / 1000 }; break;
    }
  });
  ev.writes.sort((a, b) => a.t - b.t);
  return ev;
}

export function normalizeSerial(text) {
  return String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
