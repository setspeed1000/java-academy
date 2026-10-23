# Java Academy

Learn Java from zero, in the browser. Lessons, a real Java compiler, instant auto-checking, plain-English error explanations, and saved progress. Nothing to install.

**Live site:** https://setspeed1000.github.io/java-academy/

## What's in it

- 36 exercises across 8 units: output, variables, math, decisions, loops, methods, arrays/ArrayList, classes and objects
- Real `javac` and JVM running client-side through [CheerpJ](https://cheerpj.com) (Java 8 language level)
- Auto-checks on every run: output matching, code-structure checks, and hidden tests that call your methods with other inputs
- Compile and runtime errors explained in plain English, with jump-to-line
- Hints, a solution reveal after two attempts, a sandbox, and progress saved in your browser
- Works on desktop, tablet and phone (Learn / Code / Output tabs)

Keyboard: `Ctrl/Cmd + Enter` runs, `Ctrl/Cmd + /` toggles a comment.

## Adding or changing lessons

Lessons live in `js/lessons.js`. Each exercise has `learn` (HTML), `tasks` (checklist items with tests), `starter`, `hint`, `solution`, and an optional `harness` (hidden tests compiled alongside the student's code).

Test types: `output`, `outputIncludes`, `outputRegex`, `outputLines`, `code`, `notCode`, `codeCount`, `harness`.

After editing, verify with a local JDK:

```
node tools/verify.js
```

It compiles and runs every solution (must pass all checks) and every starter (must not).

## Notes

- First load downloads the Java runtime and the compiler (`lib/tools.jar`, ~18 MB), then it's cached. The first run of a session is the slowest.
- If a network blocks `cjrtnc.leaningtech.com`, the Java engine can't load.
- An infinite loop can freeze the tab. Reload; code is saved automatically.
- Code is limited to Java 8 syntax (no `var`, records, text blocks or `String.repeat`).

## Credits

Java runs in the browser via CheerpJ by Leaning Technologies (free Community License for personal projects, with credit). `lib/tools.jar` (the JDK 8 compiler) is the same file shipped by Leaning Technologies' open-source [JavaFiddle](https://github.com/leaningtech/javafiddle). Editor: [CodeMirror 5](https://codemirror.net/5/).
