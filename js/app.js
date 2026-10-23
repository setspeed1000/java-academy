(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = Explain.esc;

  // ── Course data ──────────────────────────────────────────
  const EXERCISES = [];
  CURRICULUM.forEach((u, ui) => u.exercises.forEach((ex, ei) => {
    ex.unit = u; ex.unitNum = ui + 1; ex.num = ei + 1;
    EXERCISES.push(ex);
  }));
  const SANDBOX = {
    id: 'sandbox', title: 'Sandbox', unit: { title: 'Free practice' }, unitNum: 0, tasks: [],
    learn: '<p>A blank page for experimenting. Nothing is checked here. Write anything, press Run, and see what happens.</p><p>Your sandbox code is saved like everything else.</p>',
    starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Sandbox");\n    }\n}\n',
    hint: 'No hints here. Try something from a past lesson and change it.'
  };
  const byId = id => id === 'sandbox' ? SANDBOX : EXERCISES.find(e => e.id === id);

  // ── Saved state ──────────────────────────────────────────
  const KEY = 'java-academy:v1';
  let state = { done: {}, code: {}, attempts: {}, current: EXERCISES[0].id };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.done) state = Object.assign(state, s); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  // ── Editor ───────────────────────────────────────────────
  let editor;
  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;

  function makeEditor() {
    const host = $('editorHost');
    if (window.CodeMirror) {
      editor = CodeMirror(host, {
        mode: 'text/x-java', theme: 'academy', lineNumbers: true, indentUnit: 4, tabSize: 4,
        indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, styleActiveLine: true,
        inputStyle: 'contenteditable', spellcheck: false, autocorrect: false, autocapitalize: false,
        extraKeys: {
          'Tab': cm => cm.somethingSelected() ? cm.indentSelection('add') : cm.replaceSelection('    ', 'end'),
          'Shift-Tab': cm => cm.indentSelection('subtract'),
          'Ctrl-Enter': () => run(), 'Cmd-Enter': () => run(),
          'Ctrl-/': 'toggleComment', 'Cmd-/': 'toggleComment',
          'Ctrl-S': () => persistCode(), 'Cmd-S': () => persistCode()
        }
      });
    } else {
      // Fallback if the editor library is blocked: a plain textarea with the same small API.
      const ta = document.createElement('textarea');
      ta.className = 'fallback-editor'; ta.spellcheck = false; host.appendChild(ta);
      const handlers = [];
      ta.addEventListener('input', () => handlers.forEach(h => h()));
      ta.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
        if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('    ', s, ta.selectionEnd, 'end'); }
      });
      editor = {
        getValue: () => ta.value, setValue: v => { ta.value = v; }, on: (ev, h) => handlers.push(h),
        focus: () => ta.focus(), refresh: () => {}, clearHistory: () => {},
        addLineClass: () => {}, removeLineClass: () => {},
        setCursor: pos => { const lines = ta.value.split('\n'); let i = 0; for (let k = 0; k < pos.line; k++) i += lines[k].length + 1; ta.focus(); ta.setSelectionRange(i, i); },
        scrollIntoView: () => {}
      };
    }
    let saveTimer;
    editor.on('change', () => {
      clearMarks();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(persistCode, 400);
    });
  }

  function persistCode() {
    if (!current) return;
    state.code[current.id] = editor.getValue();
    save();
  }

  let marked = [];
  function clearMarks() {
    marked.forEach(l => { try { editor.removeLineClass(l, 'background', 'cm-error-line'); } catch (e) {} });
    marked = [];
  }
  function markLine(n) {
    const l = n - 1;
    if (l < 0) return;
    editor.addLineClass(l, 'background', 'cm-error-line');
    marked.push(l);
  }
  function goToLine(n) {
    if (isMobile()) setTab('code');
    editor.focus();
    editor.setCursor({ line: n - 1, ch: 0 });
    editor.scrollIntoView && editor.scrollIntoView({ line: n - 1, ch: 0 }, 80);
  }

  // ── Java engine (CheerpJ) ────────────────────────────────
  const BASE = new URL('.', location.href).pathname;          // e.g. /java-academy/
  const CP = '/app' + BASE + 'lib/tools.jar:/files/';
  const capture = $('console');
  const enc = new TextEncoder();
  let jvmPromise = null, jvmReady = false, queue = Promise.resolve();
  const settle = (ms) => new Promise(r => setTimeout(r, ms || 60));
  const job = fn => (queue = queue.then(fn, fn));

  function initJvm() {
    if (jvmPromise) return jvmPromise;
    if (typeof cheerpjInit !== 'function') return Promise.reject(new Error('blocked'));
    jvmPromise = cheerpjInit({ version: 8, status: 'none' }).then(() => {
      try { cheerpjCreateDisplay(1, 1, $('cjDisplay')); } catch (e) {}
      jvmReady = true;
    }).catch(e => { jvmPromise = null; throw e; });
    return jvmPromise;
  }

  function writeFile(path, text) { cheerpjAddStringFile(path, enc.encode(text)); }

  async function javac(files, outDir, silent) {
    capture.textContent = '';
    const args = [...files, '-d', outDir || '/files/', '-cp', '/str/none/', '-encoding', 'UTF-8', '-nowarn'];
    const code = await cheerpjRunMain('com.sun.tools.javac.Main', CP, ...args);
    await settle();
    if (!silent) logRaw('javac ' + args.join(' '), capture.textContent, code);
    return { ok: code === 0, text: capture.textContent };
  }

  async function java(cls, mirrorTo) {
    capture.textContent = '';
    let obs, raf = 0;
    if (mirrorTo) {
      obs = new MutationObserver(() => {
        if (raf) return;
        raf = requestAnimationFrame(() => { raf = 0; mirrorTo.textContent = capture.textContent; });
      });
      obs.observe(capture, { childList: true, subtree: true, characterData: true });
    }
    const exit = await cheerpjRunMain(cls, CP);
    await settle();
    if (obs) { obs.disconnect(); mirrorTo.textContent = capture.textContent; }
    logRaw('java ' + cls + (cls === 'Check' ? '   (hidden checker tests)' : ''), capture.textContent, exit);
    return { exit, text: capture.textContent };
  }

  // Unedited record of every step in the last run.
  let rawLog = [];
  function logRaw(cmd, text, exit) {
    rawLog.push('$ ' + cmd + '\n' + text + (text && !text.endsWith('\n') ? '\n' : '') + '[exit code ' + exit + ']');
    $('rawOut').textContent = rawLog.join('\n\n');
  }
  function setRaw(on) {
    state.raw = !!on; save();
    $('rawBtn').setAttribute('aria-pressed', String(state.raw));
    $('rawBtn').classList.toggle('on', state.raw);
    $('rawOut').hidden = !state.raw;
    ['out', 'explain'].forEach(id => { $(id).hidden = state.raw; });
    $('paneOutput').classList.toggle('raw-mode', state.raw);
  }

  // Load the engine and compile a throwaway program so the first real Run is fast.
  function warmUp() {
    setStatus('busy', 'Loading Java (first visit takes a little while)…');
    return job(async () => {
      await initJvm();
      setStatus('busy', 'Warming up the compiler…');
      writeFile('/str/Warm.java', 'public class Warm { public static void main(String[] a) { } }');
      await javac(['/str/Warm.java'], '/files/warm/', true);
    }).then(() => { if (!running) setStatus('ok', 'Ready'); })
      .catch(e => engineFailed(e));
  }

  function engineFailed(e) {
    setStatus('err', 'Java engine failed to load');
    $('out').textContent = '';
    $('explain').innerHTML = '<div class="card err-card"><strong>The Java engine couldn\'t load.</strong>' +
      '<p>This usually means your network blocks <code>cjrtnc.leaningtech.com</code> (school Wi-Fi often does) or you\'re offline. Try another network, then reload.</p>' +
      (e && e.message && e.message !== 'blocked' ? '<pre class="err-src">' + esc(e.message) + '</pre>' : '') + '</div>';
  }

  // ── Status / output UI ───────────────────────────────────
  let longRunTimer;
  function setStatus(kind, text) {
    const s = $('status');
    s.className = 'status ' + (kind || '');
    $('statusText').textContent = text;
  }

  function clearOutput() {
    $('out').textContent = '';
    $('explain').innerHTML = '';
    $('banner').hidden = true;
    $('out').classList.remove('has-error');
    rawLog = [];
    $('rawOut').textContent = '(Run your code to see the raw output of every step.)';
  }

  function showCompileErrors(text) {
    const errs = Explain.compile(text).filter(e => e.file === 'Main');
    $('out').textContent = text;
    $('out').classList.add('has-error');
    if (!errs.length) return;
    errs.forEach(e => markLine(e.line));
    const shown = errs.slice(0, 4);
    $('explain').innerHTML =
      '<h3 class="explain-title">' + (errs.length === 1 ? '1 error' : errs.length + ' errors') + ', explained</h3>' +
      shown.map(e =>
        '<div class="card err-card">' +
          '<div class="err-head"><button class="line-link" data-line="' + e.line + '">Line ' + e.line + '</button>' +
          '<span class="err-msg">' + esc(e.message) + '</span></div>' +
          (e.source ? '<pre class="err-src">' + esc(e.source.trim()) + '</pre>' : '') +
          '<p>' + e.explanation + '</p>' +
        '</div>').join('') +
      (errs.length > shown.length ? '<p class="muted">Fix these first. One mistake often causes several errors.</p>' : '') +
      (errs.length > 1 ? '<p class="muted">Tip: fix the <strong>first</strong> error and run again. Later errors are often side effects of it.</p>' : '');
  }

  function showRuntimeError(text) {
    const r = Explain.runtime(text);
    if (!r) return;
    $('out').classList.add('has-error');
    if (r.line) markLine(r.line);
    $('explain').insertAdjacentHTML('beforeend',
      '<div class="card err-card"><div class="err-head">' +
      (r.line ? '<button class="line-link" data-line="' + r.line + '">Line ' + r.line + '</button>' : '') +
      '<span class="err-msg">' + esc(r.name) + '</span></div><p>' + r.explanation + '</p></div>');
  }

  $('explain').addEventListener('click', e => {
    const b = e.target.closest('.line-link');
    if (b) goToLine(+b.dataset.line);
  });

  function showBanner(kind, html) {
    const b = $('banner');
    b.className = 'banner ' + kind;
    b.innerHTML = html;
    b.hidden = false;
  }

  // ── Tasks ────────────────────────────────────────────────
  function renderTasks(results) {
    const list = $('taskList');
    const done = !results && state.done[current.id];
    list.innerHTML = current.tasks.map((t, i) => {
      const r = results && results[i];
      const cls = r ? (r.ok ? 'ok' : 'fail') : (done ? 'ok' : '');
      const why = r && !r.ok && r.why ? '<div class="why">' + esc(r.why) + '</div>' : '';
      return '<li class="task ' + cls + '"><span class="tick" aria-hidden="true"></span><div class="task-body"><div class="task-text">' + t.text + '</div>' + why + '</div></li>';
    }).join('');
    // Only show the reason for the first failing task, so it isn't overwhelming.
    let shown = false;
    list.querySelectorAll('.task.fail').forEach(li => {
      const w = li.querySelector('.why');
      if (!w) return;
      if (shown) w.remove(); else shown = true;
    });
  }

  function updateHelp() {
    const a = state.attempts[current.id] || 0;
    $('solutionBtn').hidden = !current.solution || !(a >= 2 || state.done[current.id]);
  }

  // ── Run ──────────────────────────────────────────────────
  let running = false;
  async function run() {
    if (running) return;
    if (typeof cheerpjInit !== 'function') { engineFailed(); if (isMobile()) setTab('output'); return; }
    running = true;
    $('runBtn').disabled = true;
    persistCode();
    clearMarks(); clearOutput();
    if (isMobile()) setTab('output');
    const ex = current;
    const code = editor.getValue();
    const started = performance.now();

    try {
      await job(async () => {
        if (!jvmReady) setStatus('busy', 'Loading Java…');
        await initJvm();

        setStatus('busy', 'Compiling…');
        writeFile('/str/Main.java', code);
        const comp = await javac(['/str/Main.java']);
        if (!comp.ok) {
          showCompileErrors(comp.text);
          setStatus('err', 'Didn\'t compile');
          finish(ex, { code, compiled: false, output: '' });
          return;
        }

        setStatus('busy', 'Running…');
        longRunTimer = setTimeout(() => setStatus('busy', 'Still running… if this never ends you may have an infinite loop. Reload the page; your code is saved.'), 7000);
        const res = await java('Main', $('out'));
        clearTimeout(longRunTimer);
        const printedNothing = !res.text;
        showRuntimeError(res.text);

        const runInfo = { code, compiled: true, output: res.text, harnessCompiled: false, harnessOutput: '' };
        if (ex.harness) {
          setStatus('busy', 'Checking…');
          writeFile('/str/Check.java', Checker.buildHarness(ex));
          const hc = await javac(['/str/Main.java', '/str/Check.java']);
          runInfo.harnessCompiled = hc.ok;
          if (hc.ok) runInfo.harnessOutput = (await java('Check')).text;
          else runInfo.harnessHint = 'The checker couldn\'t use your code. Make sure it is written exactly as: ' + ex.harness.signature;
        }
        setStatus('ok', 'Finished in ' + ((performance.now() - started) / 1000).toFixed(1) + ' s' +
          (res.exit ? ', exit code ' + res.exit : '') + (printedNothing ? ', no output' : ''));
        finish(ex, runInfo);
      });
    } catch (e) {
      clearTimeout(longRunTimer);
      if (!jvmReady) engineFailed(e);
      else { setStatus('err', 'Something went wrong'); $('out').textContent = String(e && e.message || e); }
    } finally {
      running = false;
      $('runBtn').disabled = false;
      $('outDot').hidden = !isMobile() || document.querySelector('#workspace').dataset.tab === 'output';
    }
  }

  function finish(ex, runInfo) {
    if (ex !== current || !ex.tasks.length) return;
    const result = Checker.check(ex, runInfo);
    renderTasks(result.tasks);
    if (result.passed) {
      const first = !state.done[ex.id];
      state.done[ex.id] = true; save();
      const next = EXERCISES[EXERCISES.indexOf(ex) + 1];
      showBanner('pass', '<strong>All checks passed.</strong> ' + (first ? 'Exercise complete.' : 'Still correct.') +
        (next ? ' <button class="btn small" id="bannerNext">Next exercise</button>' : ' That\'s the whole course. Try the Sandbox.'));
      const bn = $('bannerNext');
      if (bn) bn.onclick = () => go(next.id);
      updateProgress(); renderDrawer(); updateNav();
    } else {
      state.attempts[ex.id] = (state.attempts[ex.id] || 0) + 1; save();
      const n = result.tasks.filter(t => t.ok).length;
      showBanner('fail', runInfo.compiled
        ? '<strong>' + n + ' of ' + result.tasks.length + ' tasks done.</strong> See the instructions for what\'s still missing.'
        : '<strong>Your code needs to compile first.</strong> Fix the error below.');
    }
    updateHelp();
  }

  // ── Navigation / rendering ───────────────────────────────
  let current = null;

  function go(id) {
    if (location.hash !== '#' + id) location.hash = id; else load(id);
  }

  function load(id) {
    const ex = byId(id) || EXERCISES[0];
    if (current) persistCode();
    clearMarks();
    current = ex;
    state.current = ex.id; save();

    $('unitLabel').textContent = ex.unitNum ? 'Unit ' + ex.unitNum + ' · ' + ex.unit.title : ex.unit.title;
    $('exTitle').textContent = ex.title;
    $('crumb').innerHTML = ex.unitNum ? '<span>' + esc(ex.unit.title) + '</span><span class="sep">/</span><strong>' + esc(ex.title) + '</strong>' : '<strong>Sandbox</strong>';
    $('learnBody').innerHTML = ex.learn;
    $('instructionsBox').hidden = !ex.tasks.length;
    $('hintBox').hidden = true;
    $('hintBox').innerHTML = ex.hint || '';
    $('hintBtn').textContent = 'Get a hint';
    renderTasks();
    updateHelp();

    editor.setValue(state.code[ex.id] != null ? state.code[ex.id] : ex.starter);
    editor.clearHistory();
    clearMarks(); clearOutput();
    if (jvmReady && !running) setStatus('ok', 'Ready');
    if (state.done[ex.id] && ex.tasks.length) showBanner('pass', '<strong>Completed.</strong> Run again any time, or move on.');

    updateNav(); renderDrawer(); closeDrawer();
    $('paneLearn').querySelector('.learn-scroll').scrollTop = 0;
    if (isMobile()) setTab('learn');
    document.title = ex.title + ' · Java Academy';
  }

  function updateNav() {
    const i = EXERCISES.indexOf(current);
    $('prevBtn').disabled = i <= 0;
    const last = i === EXERCISES.length - 1 || i < 0;
    $('nextBtn').disabled = last;
    $('nextBtn').classList.toggle('primary', !!state.done[current.id]);
    $('exCount').textContent = i >= 0 ? (i + 1) + ' / ' + EXERCISES.length : '';
  }

  function updateProgress() {
    const n = EXERCISES.filter(e => state.done[e.id]).length;
    $('progressFill').style.width = (100 * n / EXERCISES.length) + '%';
    $('progressText').textContent = n + ' / ' + EXERCISES.length;
  }

  const CHECK_SVG = '<svg viewBox="0 0 16 16" width="12" height="12"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function renderDrawer() {
    $('drawerBody').innerHTML = CURRICULUM.map((u, ui) => {
      const done = u.exercises.filter(e => state.done[e.id]).length;
      return '<div class="d-unit"><div class="d-unit-head"><span>Unit ' + (ui + 1) + ' · ' + esc(u.title) + '</span><span class="d-count">' + done + '/' + u.exercises.length + '</span></div>' +
        u.exercises.map(e =>
          '<button class="d-ex' + (state.done[e.id] ? ' done' : '') + (current && current.id === e.id ? ' current' : '') + '" data-id="' + e.id + '">' +
          '<span class="d-tick">' + (state.done[e.id] ? CHECK_SVG : '') + '</span><span>' + esc(e.title) + '</span></button>').join('') +
        '</div>';
    }).join('') +
      '<div class="d-unit"><div class="d-unit-head"><span>Extras</span></div><button class="d-ex' + (current && current.id === 'sandbox' ? ' current' : '') + '" data-id="sandbox"><span class="d-tick"></span><span>Sandbox</span></button></div>';
  }

  function openDrawer() { $('drawer').classList.add('open'); $('drawer').setAttribute('aria-hidden', 'false'); $('scrim').hidden = false; }
  function closeDrawer() { $('drawer').classList.remove('open'); $('drawer').setAttribute('aria-hidden', 'true'); $('scrim').hidden = true; }

  function setTab(tab) {
    $('workspace').dataset.tab = tab;
    document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'output') $('outDot').hidden = true;
    if (tab === 'code') setTimeout(() => editor.refresh(), 0);
  }

  // ── Wire up ──────────────────────────────────────────────
  makeEditor();

  $('runBtn').onclick = run;
  $('rawBtn').onclick = () => setRaw(!state.raw);
  setRaw(state.raw);
  $('menuBtn').onclick = openDrawer;
  $('closeDrawer').onclick = closeDrawer;
  $('scrim').onclick = closeDrawer;
  $('drawerBody').addEventListener('click', e => { const b = e.target.closest('.d-ex'); if (b) go(b.dataset.id); });
  $('prevBtn').onclick = () => { const i = EXERCISES.indexOf(current); if (i > 0) go(EXERCISES[i - 1].id); };
  $('nextBtn').onclick = () => { const i = EXERCISES.indexOf(current); if (i >= 0 && i < EXERCISES.length - 1) go(EXERCISES[i + 1].id); };
  $('hintBtn').onclick = () => {
    const h = $('hintBox'); h.hidden = !h.hidden;
    $('hintBtn').textContent = h.hidden ? 'Get a hint' : 'Hide hint';
  };
  $('solutionBtn').onclick = () => {
    if (confirm('Replace your code with the solution? Your current code will be overwritten.')) {
      editor.setValue(current.solution); persistCode();
      if (isMobile()) setTab('code');
    }
  };
  $('resetBtn').onclick = () => {
    if (confirm('Reset this exercise to the starter code?')) { editor.setValue(current.starter); persistCode(); clearOutput(); }
  };
  $('resetAll').onclick = () => {
    if (confirm('Erase all progress and saved code? This can\'t be undone.')) {
      state = { done: {}, code: {}, attempts: {}, current: EXERCISES[0].id }; save();
      current = null;
      updateProgress(); go(EXERCISES[0].id);
    }
  };
  document.querySelectorAll('#tabbar button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    if (e.key === 'Escape') closeDrawer();
  });
  window.addEventListener('hashchange', () => load(location.hash.slice(1)));
  window.addEventListener('resize', () => editor.refresh());
  window.addEventListener('beforeunload', persistCode);

  updateProgress();
  const start = location.hash.slice(1);
  load(byId(start) ? start : state.current);
  if (typeof cheerpjInit === 'function') warmUp(); else engineFailed();
})();
