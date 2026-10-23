// Shared checking logic. Runs in the browser and in Node (for lesson verification).
(function (root) {
  function stripComments(code) {
    // Remove /* */ and // comments, leaving string literals intact.
    let out = '', i = 0, inStr = false, inChar = false;
    while (i < code.length) {
      const c = code[i], n = code[i + 1];
      if (inStr) {
        out += c;
        if (c === '\\') { out += n || ''; i += 2; continue; }
        if (c === '"') inStr = false;
        i++; continue;
      }
      if (inChar) {
        out += c;
        if (c === '\\') { out += n || ''; i += 2; continue; }
        if (c === "'") inChar = false;
        i++; continue;
      }
      if (c === '"') { inStr = true; out += c; i++; continue; }
      if (c === "'") { inChar = true; out += c; i++; continue; }
      if (c === '/' && n === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
      if (c === '/' && n === '*') { i += 2; while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i++; i += 2; continue; }
      out += c; i++;
    }
    return out;
  }

  function normalize(text) {
    return String(text || '')
      .replace(/\r\n/g, '\n')
      .split('\n').map(l => l.replace(/\s+$/, '')).join('\n')
      .replace(/\n+$/, '');
  }

  function parseHarness(text) {
    const res = {};
    String(text || '').split('\n').forEach(line => {
      const m = line.match(/^(PASS|FAIL) (\S+)(?: :: (.*))?$/);
      if (m) res[m[2]] = { ok: m[1] === 'PASS', detail: m[3] || '' };
    });
    return res;
  }

  // Build the hidden Check.java from an exercise's harness definition.
  function buildHarness(ex) {
    if (!ex.harness) return null;
    const tests = ex.harness.tests.map(t => t.got
      ? '    try { Object g = ' + t.got + '; if (' + t.java + ') t("' + t.id + '", true); else fail("' + t.id + '", "got " + g); } catch (Throwable e) { fail("' + t.id + '", "your code crashed: " + e); }'
      : '    try { t("' + t.id + '", ' + t.java + '); } catch (Throwable e) { fail("' + t.id + '", "your code crashed: " + e); }'
    ).join('\n');
    return [
      'import java.io.*;',
      'import java.util.*;',
      'public class Check {',
      '  static void t(String id, boolean ok) { System.out.println((ok ? "PASS " : "FAIL ") + id); }',
      '  static void fail(String id, String why) { System.out.println("FAIL " + id + " :: " + why.replace("\\n", " ")); }',
      '  static String capture(Runnable r) {',
      '    PrintStream old = System.out;',
      '    ByteArrayOutputStream buf = new ByteArrayOutputStream();',
      '    System.setOut(new PrintStream(buf, true));',
      '    try { r.run(); } finally { System.out.flush(); System.setOut(old); }',
      '    return buf.toString().replace("\\r", "").trim();',
      '  }',
      '  static boolean near(double a, double b) { return Math.abs(a - b) < 1e-6; }',
      '  public static void main(String[] args) {',
      tests,
      '  }',
      '}'
    ].join('\n');
  }

  // run = { code, compiled, output, harnessCompiled, harnessOutput }
  function check(ex, run) {
    const code = stripComments(run.code || '');
    const output = normalize(run.output);
    const harness = parseHarness(run.harnessOutput);
    const tasks = (ex.tasks || []).map(task => {
      let ok = !!run.compiled, why = run.compiled ? '' : 'Your code needs to compile first.';
      if (ok) {
        for (const t of task.tests) {
          const r = runTest(t, code, output, harness, run);
          if (!r.ok) { ok = false; why = r.why; break; }
        }
      }
      return { text: task.text, ok, why };
    });
    return { tasks, passed: tasks.length > 0 && tasks.every(t => t.ok) };
  }

  function runTest(t, code, output, harness, run) {
    switch (t.type) {
      case 'output': {
        const exp = normalize(t.expected);
        if (output === exp) return { ok: true };
        return { ok: false, why: (t.msg ? t.msg + ' ' : '') + 'Expected output:\n' + exp + '\nYour output:\n' + (output || '(nothing)') };
      }
      case 'outputIncludes':
        return output.includes(t.text) ? { ok: true } : { ok: false, why: t.msg || ('Your output should include: ' + t.text) };
      case 'outputRegex':
        return new RegExp(t.pattern, t.flags !== undefined ? t.flags : 'm').test(output) ? { ok: true } : { ok: false, why: t.msg };
      case 'outputLines': {
        const n = output ? output.split('\n').length : 0;
        return n === t.count ? { ok: true } : { ok: false, why: t.msg || ('Expected ' + t.count + ' lines of output, got ' + n + '.') };
      }
      case 'code':
        return new RegExp(t.pattern, t.flags || '').test(code) ? { ok: true } : { ok: false, why: t.msg };
      case 'notCode':
        return new RegExp(t.pattern, t.flags || '').test(code) ? { ok: false, why: t.msg } : { ok: true };
      case 'codeCount': {
        const m = code.match(new RegExp(t.pattern, 'g')) || [];
        return m.length >= t.min ? { ok: true } : { ok: false, why: t.msg };
      }
      case 'harness': {
        if (!run.harnessCompiled) return { ok: false, why: t.msg + (run.harnessHint ? ' ' + run.harnessHint : '') };
        const r = harness[t.id];
        if (!r) return { ok: false, why: t.msg };
        return r.ok ? { ok: true } : { ok: false, why: t.msg + (r.detail ? ' (' + r.detail + ')' : '') };
      }
      default:
        return { ok: false, why: 'Unknown test type ' + t.type };
    }
  }

  const api = { check, buildHarness, stripComments, normalize, parseHarness };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Checker = api;
})(this);
