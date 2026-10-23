// Runs Clang (YoWASP) off the main thread. Messages:
//   in:  {type:'init'} | {type:'compile', id, source}
//   out: {type:'progress', done, total} | {type:'ready'} | {type:'result', id, ok, wasm, log} | {type:'fatal', message}
import { runClang, runLLVM } from '../vendor/yowasp/bundle.js';
import { compileArgs } from './sketch.js';

let support = null;
let ready = null;

async function loadSupport() {
  const base = new URL('../arduino/', import.meta.url);
  const text = async f => (await fetch(new URL(f, base))).text();
  const [ah, sh, core] = await Promise.all([
    text('Arduino.h'), text('Servo.h'),
    fetch(new URL('core.o', base)).then(r => { if (!r.ok) throw new Error('core.o HTTP ' + r.status); return r.arrayBuffer(); })
  ]);
  return { 'Arduino.h': ah, 'Servo.h': sh, 'core.o': new Uint8Array(core) };
}

const progress = ({ totalLength, doneLength }) => postMessage({ type: 'progress', done: doneLength, total: totalLength });

async function compile(source) {
  let log = '';
  const dec = new TextDecoder();
  const sink = b => { if (b) log += dec.decode(b, { stream: true }); };
  try {
    const out = await runClang(compileArgs(), Object.assign({}, support, { 'build.cpp': source }),
      { stdout: sink, stderr: sink, fetchProgress: progress });
    return { ok: true, wasm: new Uint8Array(out['sketch.wasm']), log };
  } catch (e) {
    if (e && typeof e.code === 'number') return { ok: false, log };
    throw e;
  }
}

function init() {
  if (!ready) {
    ready = (async () => {
      const [sup] = await Promise.all([loadSupport(), runLLVM(null, {}, { fetchProgress: progress })]);
      support = sup;
      // Warm-up compile: downloads the toolchain and primes the caches.
      const r = await compile('#include "Arduino.h"\nvoid setup(){}\nvoid loop(){}\n');
      if (!r.ok) throw new Error('Warm-up compile failed:\n' + r.log);
    })();
  }
  return ready;
}

onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === 'init') { await init(); postMessage({ type: 'ready' }); }
    if (msg.type === 'compile') {
      await init();
      const r = await compile(msg.source);
      const transfer = r.wasm ? [r.wasm.buffer] : [];
      postMessage({ type: 'result', id: msg.id, ok: r.ok, wasm: r.wasm, log: r.log }, transfer);
    }
  } catch (err) {
    postMessage({ type: 'fatal', id: msg.id, message: String(err && err.stack || err) });
  }
};
