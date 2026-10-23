// Verifies every lesson with the same compiler and simulator the website uses:
// each solution must pass all checks, and each starter must not.
// Usage: node tools/verify.mjs [exercise-id ...]
import CURRICULUM from '../js/lessons.js';
import { check } from '../js/checker.js';
import { simulate } from './pipeline-node.mjs';

const only = process.argv.slice(2);
let failures = 0, count = 0;
for (const unit of CURRICULUM) for (const ex of unit.exercises) {
  if (only.length && !only.includes(ex.id)) continue;
  count++;
  const sol = await simulate(ex, ex.solution);
  const r = check(ex, sol);
  if (!r.passed) {
    failures++;
    console.log('FAIL solution ' + ex.id + ' ' + ex.title);
    if (!sol.compiled) console.log(sol.log);
    if (sol.harnessLog) console.log(sol.harnessLog);
    r.tasks.filter(t => !t.ok).forEach(t => console.log('   - ' + t.text.replace(/<[^>]+>/g, '') + '\n     ' + String(t.why).replace(/\n/g, '\n     ')));
  } else if (sol.log && /warning/.test(sol.log)) {
    console.log('WARN ' + ex.id + ' solution has compiler warnings:\n' + sol.log);
  }
  const st = await simulate(ex, ex.starter);
  if (check(ex, st).passed) { failures++; console.log('FAIL starter passes already: ' + ex.id); }
  process.stdout.write('.');
}
console.log('\n' + (failures ? failures + ' problem(s)' : 'All good') + ' across ' + count + ' exercises.');
process.exit(failures ? 1 : 0);
