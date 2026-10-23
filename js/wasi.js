// Minimal WASI (preview 1) host for running compiled sketches. Works in browsers, workers and Node.
export class ProcExit extends Error {
  constructor(code) { super('exit ' + code); this.code = code; }
}

export function runWasi(module, { args = [], onStdout = () => {}, onStderr = () => {} } = {}) {
  let memory;
  const enc = new TextEncoder();
  const argv = ['sketch', ...args].map(a => enc.encode(a + '\0'));
  const view = () => new DataView(memory.buffer);
  const bytes = () => new Uint8Array(memory.buffer);
  const ENOSYS = 52, EBADF = 8, OK = 0;

  const wasi = {
    args_sizes_get(argcPtr, bufSizePtr) {
      view().setUint32(argcPtr, argv.length, true);
      view().setUint32(bufSizePtr, argv.reduce((n, a) => n + a.length, 0), true);
      return OK;
    },
    args_get(argvPtr, bufPtr) {
      const v = view(), b = bytes();
      argv.forEach((a, i) => { v.setUint32(argvPtr + i * 4, bufPtr, true); b.set(a, bufPtr); bufPtr += a.length; });
      return OK;
    },
    environ_sizes_get(countPtr, sizePtr) { view().setUint32(countPtr, 0, true); view().setUint32(sizePtr, 0, true); return OK; },
    environ_get() { return OK; },
    fd_write(fd, iovs, iovsLen, nwrittenPtr) {
      const v = view(), b = bytes();
      let total = 0;
      for (let i = 0; i < iovsLen; i++) {
        const ptr = v.getUint32(iovs + i * 8, true), len = v.getUint32(iovs + i * 8 + 4, true);
        const chunk = b.slice(ptr, ptr + len);
        if (fd === 1) onStdout(chunk); else if (fd === 2) onStderr(chunk); else return EBADF;
        total += len;
      }
      view().setUint32(nwrittenPtr, total, true);
      return OK;
    },
    fd_read(fd, iovs, iovsLen, nreadPtr) { view().setUint32(nreadPtr, 0, true); return OK; },
    fd_close() { return OK; },
    fd_seek() { return ENOSYS; },
    fd_fdstat_get(fd, ptr) {
      if (fd > 2) return EBADF;
      const v = view();
      v.setUint8(ptr, 2); v.setUint16(ptr + 2, 0, true);
      v.setBigUint64(ptr + 8, 0n, true); v.setBigUint64(ptr + 16, 0n, true);
      return OK;
    },
    fd_prestat_get() { return EBADF; },
    fd_prestat_dir_name() { return EBADF; },
    clock_time_get(id, precision, ptr) { view().setBigUint64(ptr, BigInt(Date.now()) * 1000000n, true); return OK; },
    random_get(ptr, len) { const b = bytes(); for (let i = 0; i < len; i++) b[ptr + i] = (Math.random() * 256) | 0; return OK; },
    proc_exit(code) { throw new ProcExit(code); },
    sched_yield() { return OK; }
  };
  const imports = { wasi_snapshot_preview1: new Proxy(wasi, { get: (t, k) => t[k] || (() => ENOSYS) }) };
  const instance = new WebAssembly.Instance(module, imports);
  memory = instance.exports.memory;
  try {
    instance.exports._start();
    return { code: 0 };
  } catch (e) {
    if (e instanceof ProcExit) return { code: e.code };
    return { code: -1, trap: describeTrap(e) };
  }
}

function describeTrap(e) {
  const msg = String(e && e.message || e);
  if (/divide by zero|division by zero/i.test(msg)) return { kind: 'divzero', message: msg };
  if (/call stack|stack size|too much recursion/i.test(msg)) return { kind: 'stack', message: msg };
  if (/out of bounds|memory access/i.test(msg)) return { kind: 'memory', message: msg };
  if (/unreachable/i.test(msg)) return { kind: 'unreachable', message: msg };
  return { kind: 'other', message: msg };
}
