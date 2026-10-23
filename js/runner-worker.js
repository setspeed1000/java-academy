// Runs one compiled sketch. Streams output back so it survives if the worker is stopped.
//   in:  {wasm, args}
//   out: {type:'out', stdout, stderr} ... {type:'done', code, trap}
import { runWasi } from './wasi.js';

onmessage = async (e) => {
  const { wasm, args } = e.data;
  const dec1 = new TextDecoder(), dec2 = new TextDecoder();
  let so = '', se = '', last = performance.now();
  const flush = (force) => {
    if (!force && performance.now() - last < 40) return;
    if (so || se) postMessage({ type: 'out', stdout: so, stderr: se });
    so = ''; se = ''; last = performance.now();
  };
  try {
    const module = await WebAssembly.compile(wasm);
    const r = runWasi(module, {
      args,
      onStdout: b => { so += dec1.decode(b, { stream: true }); flush(false); },
      onStderr: b => { se += dec2.decode(b, { stream: true }); flush(false); }
    });
    flush(true);
    postMessage({ type: 'done', code: r.code, trap: r.trap || null });
  } catch (err) {
    flush(true);
    postMessage({ type: 'done', code: -1, trap: { kind: 'other', message: String(err && err.message || err) } });
  }
};
