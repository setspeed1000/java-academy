// Plain-English explanations for Clang errors, linker errors, simulator warnings and crashes.
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ARDUINO_NAMES = ['Serial', 'pinMode', 'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite', 'delay', 'delayMicroseconds',
  'millis', 'micros', 'tone', 'noTone', 'random', 'randomSeed', 'map', 'constrain', 'String', 'HIGH', 'LOW', 'INPUT', 'OUTPUT',
  'INPUT_PULLUP', 'LED_BUILTIN', 'Servo', 'setup', 'loop', 'boolean', 'byte', 'true', 'false'];
const byLower = {};
ARDUINO_NAMES.forEach(n => { byLower[n.toLowerCase()] = n; });

function caseHint(name) {
  const right = byLower[String(name).toLowerCase()];
  return right && right !== name ? 'Capitals matter: it\'s <code>' + esc(right) + '</code>, not <code>' + esc(name) + '</code>.' : null;
}

const RULES = [
  [/expected ';'/, () => 'Missing semicolon. Statements end with <code>;</code>. The arrow points to where it\'s missing, usually the end of that line.'],
  [/missing terminating " character/, () => 'Text is missing its closing double quote <code>"</code>.'],
  [/missing terminating ' character/, () => 'A <code>char</code> uses single quotes around one character, like <code>\'A\'</code>. For text, use double quotes.'],
  [/use of undeclared identifier '([^']+)'(; did you mean '([^']+)'\?)?/, m => caseHint(m[1]) ||
    (m[3] ? 'Did you mean <code>' + esc(m[3]) + '</code>? Check spelling and capitals.' :
      'The compiler doesn\'t know <code>' + esc(m[1]) + '</code>. Check the spelling and capitals, make sure you created it (with its type) before using it, and that it isn\'t inside a different set of braces.')],
  [/unknown type name '([^']+)'/, m => m[1] === 'string' ? 'On Arduino the text type is <code>String</code> with a capital S.' :
    (caseHint(m[1]) || 'The compiler doesn\'t recognise the type <code>' + esc(m[1]) + '</code>. Check spelling and capitals (<code>int</code>, <code>float</code>, <code>bool</code>, <code>String</code>…), or a missing <code>#include</code>.')],
  [/expected '}'|expected unqualified-id|extraneous closing brace/, () => 'The curly braces don\'t match up. Every <code>{</code> needs a <code>}</code>. Code outside <code>setup</code>, <code>loop</code> or your own functions can only create variables or functions, not run statements.'],
  [/function definition is not allowed here/, () => 'You started a function inside another one. Usually a <code>}</code> is missing just above, so the previous function never closed.'],
  [/redefinition of '([^']+)'/, m => 'You created <code>' + esc(m[1]) + '</code> twice. To change an existing variable, leave off the type.'],
  [/non-void function does not return a value/, () => 'This function promises to give back a value, but at least one path through it never reaches a <code>return</code>.'],
  [/no matching (member )?function for call to '(print|println)'/, () => '<code>print</code> and <code>println</code> take one value at a time (plus an optional format like <code>HEX</code>). To print several things, use one <code>print</code> per piece.'],
  [/no matching (member )?function for call to '([^']+)'/, m => 'You called <code>' + esc(m[2]) + '</code> with inputs it doesn\'t accept. Check how many values you passed and their types.'],
  [/too (few|many) arguments to function call, expected (\d+), have (\d+)/, m => 'This function needs ' + m[2] + ' input(s), but you gave it ' + m[3] + '.'],
  [/too (few|many) arguments to function call/, m => 'Too ' + m[1] + ' inputs in this function call.'],
  [/invalid operands to binary expression \('const char \*' and 'const char \*'\)|invalid operands to binary expression \('const char\[\d+\]' and 'const char\[\d+\]'\)/, () => 'You can\'t join two pieces of plain text with <code>+</code>. Print them separately, or wrap the first in <code>String(...)</code>.'],
  [/invalid operands to binary expression/, () => 'These two values can\'t be combined with this operator. Check the types on each side.'],
  [/cannot initialize a variable of type '(int|long|float|double|byte|bool)' with an lvalue of type 'const char/, m => 'That\'s text, but the variable is a <code>' + esc(m[1]) + '</code>. Remove the quotes, or make it a <code>String</code>.'],
  [/cannot initialize|no viable conversion/, () => 'The value doesn\'t match the variable\'s type.'],
  [/expected expression/, () => 'Something is missing or out of place here, for example an extra bracket or an operator with nothing after it.'],
  [/expected '\)'/, () => 'Brackets don\'t match up. Every <code>(</code> needs a matching <code>)</code>.'],
  [/expected '\(' after '(if|while|for|switch)'/, m => '<code>' + m[1] + '</code> needs its condition in round brackets.'],
  [/'(\w+)' cannot be used|called object type/, () => 'You used something as a function that isn\'t one. Check the brackets.'],
  [/subscripted value is not an array/, () => 'Square brackets only work on arrays.'],
  [/array index (\d+) is past the end of the array/, m => 'Index ' + m[1] + ' doesn\'t exist in this array. Indexes go from 0 to size − 1. On a real board this reads or overwrites random memory.'],
  [/excess elements in array initializer/, () => 'You listed more values than the array has room for.'],
  [/variable-sized object may not be initialized/, () => 'An array\'s size must be a fixed number (or a <code>const</code>) if you also list its values.'],
  [/'(\w+)' file not found/, m => 'There\'s no library called <code>' + esc(m[1]) + '</code> in this simulator. Available: <code>Arduino.h</code> and <code>Servo.h</code>.'],
  // Warnings
  [/using the result of an assignment as a condition/, () => 'You wrote <code>=</code> (store a value) where you probably meant <code>==</code> (compare). As written, this condition always changes the variable.'],
  [/adding '\w+' to a string does not append/, () => 'In C++, <code>"text" + number</code> doesn\'t join them. It skips characters in the text. Print the pieces separately, or use <code>String("text") + number</code>.'],
  [/implicit conversion from '(float|double)' to '(\w+)' changes value from ([\d.e+-]+) to ([\d.e+-]+)/, m => 'You put a decimal (' + m[3] + ') into a whole-number type, so it becomes ' + m[4] + '. Use <code>float</code> if you need the decimals.'],
  [/variable '(\w+)' is uninitialized when used here/, m => '<code>' + esc(m[1]) + '</code> is used before it has a value, so it holds garbage. Give it a starting value.'],
  [/result of comparison against a string literal is unspecified/, () => 'Comparing text with <code>==</code> only works on <code>String</code> variables, not on plain <code>"text"</code> or <code>char</code> arrays.'],
  [/expression result unused|equality comparison result unused/, () => 'This line calculates something but does nothing with it. Did you mean <code>=</code> instead of <code>==</code>, or forget to print it?'],
  [/if statement has empty body|for loop has empty body|while loop has empty body/, () => 'There\'s a semicolon right after the condition, so the block below runs no matter what. Remove that <code>;</code>.'],
  [/division by zero/, () => 'Dividing by zero. On a real Uno the result is garbage.'],
  [/comparison of integers of different signs|comparison is always (true|false)/, () => 'This comparison can\'t behave the way you expect because of the types involved.'],
  [/overflow in expression|implicit conversion from '(int|long)' to '(\w+)' changes value/, () => 'The number is too big for this type and wraps around.']
];

export function parseDiagnostics(log) {
  const lines = String(log || '').split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    let m = lines[i].match(/^sketch\.ino:(\d+):(\d+): (error|fatal error|warning): (.*)$/);
    if (m) {
      const message = m[4].replace(/ \[-W[\w-]+(=[\w-]+)?\]$/, '');
      const src = (lines[i + 1] || '').replace(/^\s*\d+\s*\|\s?/, '');
      let explanation = null;
      for (const [re, fn] of RULES) { const mm = message.match(re); if (mm) { explanation = fn(mm); break; } }
      out.push({ line: +m[1], col: +m[2], severity: m[3] === 'warning' ? 'warning' : 'error', message, source: src, explanation });
      continue;
    }
    m = lines[i].match(/undefined symbol: (\w+)(\(.*\))?/);
    if (m) {
      const name = m[1];
      const explanation = (name === 'setup' || name === 'loop')
        ? 'Every sketch needs both a <code>void setup()</code> and a <code>void loop()</code> function, even if one of them is empty. Yours is missing <code>' + name + '</code> (check the spelling and capitals).'
        : 'You call <code>' + esc(name) + '</code>, and it\'s declared but never actually written (defined). Add the function with its body.';
      out.push({ line: null, severity: 'error', message: 'undefined: ' + name, source: '', explanation });
    }
  }
  return out;
}

export const WARNINGS = {
  nobegin: () => 'You printed before starting Serial. On a real board nothing would appear. Start Serial in <code>setup</code> first.',
  nooutput: pin => 'Pin ' + pin + ' was written to, but never set as an <code>OUTPUT</code> with <code>pinMode</code>. On a real board an LED there would barely glow.',
  nopwm: pin => 'Pin ' + pin + ' can\'t do <code>analogWrite</code> on an Uno, so it acts as fully on or off. PWM pins are 3, 5, 6, 9, 10 and 11.',
  badpin: pin => 'Pin ' + pin + ' doesn\'t exist on an Uno. Pins go from 0 to 13, plus A0 to A5.',
  nattach: () => 'You moved a servo before attaching it to a pin. Call <code>attach</code> in <code>setup</code> first.'
};

export const TRAPS = {
  divzero: 'Your sketch divided a whole number by zero and crashed. (A real Uno wouldn\'t crash, but the result would be garbage.)',
  stack: 'A function kept calling itself forever and ran out of memory.',
  memory: 'Your sketch read or wrote memory it doesn\'t own, usually an array index that\'s out of range.',
  unreachable: 'Your sketch hit a point that should never be reached, often a function that ends without returning a value.',
  other: 'Your sketch crashed while running.'
};

export const END_REASONS = {
  time: t => 'Simulated ' + (t / 1000).toFixed(1) + ' s of run time',
  output: () => 'Stopped: too much Serial output. A print inside <code>loop()</code> with no delay floods the Serial Monitor.',
  events: () => 'Stopped: too many pin changes. Is something switching with no delay?'
};
