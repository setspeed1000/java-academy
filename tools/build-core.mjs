// Rebuilds arduino/core.o with the same Clang the website uses. Run after editing core.cpp or the headers.
// Usage: node tools/build-core.mjs
import fs from 'node:fs';
import { runClang } from '../vendor/yowasp/bundle.js';
import { COMPILE_FLAGS } from '../js/sketch.js';

const dir = new URL('../arduino/', import.meta.url);
const read = f => fs.readFileSync(new URL(f, dir), 'utf8');
let log = '';
const dec = new TextDecoder();
const sink = b => { if (b) log += dec.decode(b); };
try {
  const flags = COMPILE_FLAGS.map(f => f === '-O0' ? '-O1' : f);
  const out = await runClang(['clang++', ...flags, '-c', 'core.cpp', '-o', 'core.o'],
    { 'Arduino.h': read('Arduino.h'), 'Servo.h': read('Servo.h'), 'core.cpp': read('core.cpp') },
    { stdout: sink, stderr: sink, fetchProgress: () => {} });
  fs.writeFileSync(new URL('core.o', dir), out['core.o']);
  if (log) console.log(log);
  console.log('Wrote arduino/core.o (' + out['core.o'].length + ' bytes)');
} catch (e) {
  console.error(log || e);
  process.exit(1);
}
