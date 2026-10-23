// Node version of the website's compile → run → check pipeline (same compiler, same runtime).
import fs from 'node:fs';
import { runClang } from '../vendor/yowasp/bundle.js';
import { compileArgs, buildSource, buildHarness, scenarioArg, parseEvents, normalizeSerial } from '../js/sketch.js';
import { runWasi } from '../js/wasi.js';

const dir = new URL('../arduino/', import.meta.url);
const support = {
  'Arduino.h': fs.readFileSync(new URL('Arduino.h', dir), 'utf8'),
  'Servo.h': fs.readFileSync(new URL('Servo.h', dir), 'utf8'),
  'core.o': new Uint8Array(fs.readFileSync(new URL('core.o', dir)))
};

export async function compile(source) {
  let log = '';
  const dec = new TextDecoder();
  const sink = b => { if (b) log += dec.decode(b, { stream: true }); };
  try {
    const out = await runClang(compileArgs(), Object.assign({}, support, { 'build.cpp': source }),
      { stdout: sink, stderr: sink, fetchProgress: () => {} });
    return { ok: true, wasm: out['sketch.wasm'], log };
  } catch (e) {
    if (e && typeof e.code === 'number') return { ok: false, log };
    throw e;
  }
}

export async function execute(wasm, args) {
  const mod = await WebAssembly.compile(wasm);
  const d1 = new TextDecoder(), d2 = new TextDecoder();
  let stdout = '', stderr = '';
  const r = runWasi(mod, { args: [args], onStdout: b => { stdout += d1.decode(b, { stream: true }); }, onStderr: b => { stderr += d2.decode(b, { stream: true }); } });
  return { stdout, stderr, code: r.code, trap: r.trap || null };
}

// Full pipeline for one exercise and one piece of code → the `run` object the checker expects.
export async function simulate(ex, code) {
  const run = { code, compiled: false, serial: '', ev: parseEvents(''), log: '', harnessCompiled: false, harnessResults: {} };
  const c = await compile(buildSource(code));
  run.log = c.log;
  if (!c.ok) return run;
  run.compiled = true;
  const r = await execute(c.wasm, scenarioArg(ex.scenario));
  run.serial = normalizeSerial(r.stdout);
  run.ev = parseEvents(r.stderr);
  run.trap = r.trap;
  if (ex.harness) {
    const hc = await compile(buildHarness(code, ex));
    run.harnessCompiled = hc.ok;
    if (hc.ok) {
      const hr = await execute(hc.wasm, scenarioArg(ex.scenario, true));
      run.harnessResults = parseEvents(hr.stderr).results;
      run.harnessTrap = hr.trap;
    } else run.harnessLog = hc.log;
  }
  return run;
}
