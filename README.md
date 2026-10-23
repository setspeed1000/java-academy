# Sketch Academy

Learn Arduino C++ from zero, in the browser. Lessons, a real C++ compiler, a simulated Arduino Uno, instant auto-checking, plain-English error explanations, and saved progress. Nothing to install, no account, no server.

**Live site:** https://setspeed1000.github.io/java-academy/

## What's in it

- 43 exercises across 10 units: Serial output, variables, math, LEDs, decisions and inputs, loops, functions, arrays, timing with `millis()`, and motors/servos
- Sketches compile with real Clang/LLVM running in your browser ([YoWASP](https://yowasp.org)), then run on a simulated Uno: `Serial`, `pinMode`/`digitalWrite`/`digitalRead`, `analogRead`/`analogWrite`, `delay`/`millis`, `tone`, `map`/`constrain`, `String`, and the `Servo` library
- Simulated time: a 10-second sketch runs in a fraction of a second, then the **Board** tab replays it in real time with LEDs, servos, inputs and a timeline of every pin
- Auto-checks on every run: Serial output, pin modes, blink timing, pin states at specific moments, code structure, and hidden tests that call your functions with other inputs
- Simulated inputs: buttons, sensors and Serial Monitor text, scripted per exercise (and adjustable in the Sandbox)
- Compiler errors and warnings explained in plain English, with jump-to-line; runtime crashes and stuck loops detected
- **Raw** tab shows every step's unedited output: compiler command and log, Serial output, board event stream, exit codes
- Hints, a read-only solution panel after two attempts, a sandbox, and progress saved in your browser
- Works on desktop, tablet and phone

Keyboard: `Ctrl/Cmd + Enter` runs, `Ctrl/Cmd + /` toggles a comment.

## How it works

1. `js/sketch.js` turns `sketch.ino` into a C++ file: it adds `#include "Arduino.h"` and, like the Arduino IDE, declares your functions up front so they can be called before they're defined. `#line` directives keep error line numbers matching the editor.
2. `js/compiler-worker.js` compiles it with Clang (in a Web Worker) and links it against `arduino/core.o`, the simulated Uno.
3. `js/runner-worker.js` runs the result in a fresh worker (`js/wasi.js` is the tiny runtime). Serial output streams to stdout; pin activity streams to stderr as events. Stuck sketches are stopped after a few seconds.
4. `js/checker.js` grades the run against the exercise's tests.

## Editing lessons

Lessons live in `js/lessons.js`. Each exercise has `learn` (HTML), `tasks` (checklist items with tests), `starter`, `hint`, `solution`, and optionally `scenario` (run length and simulated inputs), `inputs` (a description of them) and `harness` (hidden C++ tests).

Test types: `serial`, `serialIncludes`, `serialRegex`, `serialLines`, `began`, `pinMode`, `blink`, `code`, `notCode`, `codeCount`, `harness`, `fn` (custom JavaScript check).

Verify after editing (needs Node 20+):

```
node tools/verify.mjs
```

It compiles and runs every solution (must pass all checks) and every starter (must not), using the same compiler and simulator as the site.

If you change `arduino/core.cpp`, `Arduino.h` or `Servo.h`, rebuild the core first: `node tools/build-core.mjs`.

## Notes

- First visit downloads the compiler (about 27 MB), then the browser caches it. Later runs take well under a second.
- Simulator differences from a real Uno: `int` is 32-bit here (16-bit on an Uno), `double` is 64-bit, and memory isn't limited to 2 KB. Lessons avoid code that depends on these.
- Libraries available: the core Arduino API and `Servo.h`.

## Credits

C++ compiler: [YoWASP Clang](https://github.com/YoWASP/clang) (ISC), a WebAssembly build of [LLVM/Clang](https://llvm.org/) (Apache 2.0 with LLVM exceptions) with wasi-libc and libc++. Stored gzipped in `vendor/yowasp/` and patched by `tools/vendor-yowasp.mjs` to decompress in the browser. Editor: [CodeMirror 5](https://codemirror.net/5/) (MIT). The simulated core is an independent implementation of the public Arduino API.
