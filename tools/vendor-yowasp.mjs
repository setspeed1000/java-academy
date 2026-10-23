// Copies the YoWASP Clang toolchain into vendor/yowasp, gzips the two large assets,
// and patches the loader so it fetches the .gz files and decompresses them in the browser.
// Usage: node tools/vendor-yowasp.mjs <path to extracted @yowasp/clang package>/gen
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const src = process.argv[2];
if (!src) { console.error('usage: node tools/vendor-yowasp.mjs <package>/gen'); process.exit(1); }
const dst = new URL('../vendor/yowasp/', import.meta.url).pathname;
fs.mkdirSync(dst, { recursive: true });

const BIG = ['llvm.core.wasm', 'llvm-resources.tar'];
for (const f of fs.readdirSync(src)) {
  const data = fs.readFileSync(path.join(src, f));
  if (BIG.includes(f)) fs.writeFileSync(path.join(dst, f + '.gz'), zlib.gzipSync(data, { level: 9 }));
  else if (f !== 'bundle.js') fs.writeFileSync(path.join(dst, f), data);
}

let js = fs.readFileSync(path.join(src, 'bundle.js'), 'utf8');
const before = `} else {
  fetch2 = globalThis.fetch;
}`;
const after = `} else {
  fetch2 = globalThis.fetch;
}
// ── Arduino Academy patch: large assets are stored gzipped ──
{
  const plainFetch = fetch2;
  const BIG = /(llvm\\.core\\.wasm|llvm-resources\\.tar)$/;
  fetch2 = async function(url, options) {
    const u = new URL(url);
    if (!BIG.test(u.pathname)) return plainFetch(url, options);
    const gzUrl = new URL(u.href + ".gz");
    const type = u.pathname.endsWith(".wasm") ? "application/wasm" : "application/octet-stream";
    if (typeof process === "object" && process.release?.name === "node" && u.protocol === "file:") {
      const { readFile } = await import("node:fs/promises");
      const { gunzipSync } = await import("node:zlib");
      const data = gunzipSync(await readFile(gzUrl));
      return new Response(data, { headers: { "content-type": type, "content-length": data.length } });
    }
    const res = await plainFetch(gzUrl, options);
    if (!res.ok) throw new Error("Could not download " + gzUrl.pathname + " (HTTP " + res.status + ")");
    return new Response(res.body.pipeThrough(new DecompressionStream("gzip")), { headers: { "content-type": type } });
  };
}`;
if (!js.includes(before)) { console.error('Patch point not found; the bundle layout changed.'); process.exit(1); }
js = js.replace(before, after).replace('var fetch_default = fetch2;', 'var fetch_default = (url, options) => fetch2(url, options);');
fs.writeFileSync(path.join(dst, 'bundle.js'), js);
for (const f of fs.readdirSync(dst)) console.log(f.padEnd(26), (fs.statSync(path.join(dst, f)).size / 1048576).toFixed(1) + ' MB');
