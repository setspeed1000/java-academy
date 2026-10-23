// Verifies every lesson with a real JDK: each solution must pass all checks, each starter must not.
// Usage: node tools/verify.js   (needs javac/java on PATH)
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const CURRICULUM = require('../js/lessons.js');
const Checker = require('../js/checker.js');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ja-'));
const empty = path.join(tmp, 'empty'); fs.mkdirSync(empty);

function sh(cmd, args, cwd) {
  try {
    const out = execFileSync(cmd, args, { cwd, timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, text: out.toString() };
  } catch (e) {
    return { ok: false, text: (e.stdout || '').toString() + (e.stderr || '').toString() };
  }
}
const javac = (dir, files) => sh('javac', ['--release', '8', '-nowarn', '-Xlint:-options', '-cp', empty, '-d', path.join(dir, 'out'), ...files], dir);
const java = (dir, cls) => sh('java', ['-cp', path.join(dir, 'out'), cls], dir);

function simulate(ex, code, label) {
  const dir = path.join(tmp, ex.id + '-' + label); fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'Main.java'), code);
  const run = { code, compiled: false, output: '', harnessCompiled: false, harnessOutput: '' };
  const c = javac(dir, ['Main.java']);
  run.compiled = c.ok;
  if (!c.ok) { run.output = c.text; return run; }
  run.output = java(dir, 'Main').text;
  const h = Checker.buildHarness(ex);
  if (h) {
    const hdir = path.join(dir, 'h'); fs.mkdirSync(hdir);
    fs.writeFileSync(path.join(hdir, 'Main.java'), code);
    fs.writeFileSync(path.join(hdir, 'Check.java'), h);
    const hc = javac(hdir, ['Main.java', 'Check.java']);
    run.harnessCompiled = hc.ok;
    if (hc.ok) run.harnessOutput = java(hdir, 'Check').text;
    else run.harnessCompileLog = hc.text;
  }
  return run;
}

let failures = 0, count = 0;
for (const unit of CURRICULUM) for (const ex of unit.exercises) {
  count++;
  const sol = simulate(ex, ex.solution, 'sol');
  const r = Checker.check(ex, sol);
  if (!r.passed) {
    failures++;
    console.log('FAIL solution ' + ex.id + ' ' + ex.title);
    r.tasks.filter(t => !t.ok).forEach(t => console.log('   - ' + t.text.replace(/<[^>]+>/g, '') + '\n     ' + t.why.replace(/\n/g, '\n     ')));
    if (sol.harnessCompileLog) console.log(sol.harnessCompileLog);
  }
  const st = simulate(ex, ex.starter, 'start');
  if (Checker.check(ex, st).passed) { failures++; console.log('FAIL starter passes already: ' + ex.id); }
}
console.log((failures ? failures + ' problem(s)' : 'All good') + ' across ' + count + ' exercises.');
process.exit(failures ? 1 : 0);
