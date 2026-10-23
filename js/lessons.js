// Curriculum: Arduino C++ from zero.
// Each exercise: learn (HTML), tasks (checklist + tests), starter, hint, solution,
// optional scenario (simulated inputs + run length), inputs (plain-English description), harness (hidden tests).
// Rule: tasks, hints and checker messages describe what to do in words. Code only appears in lesson examples
// (which use different code from the answer) and in the solution.

const SK = (setupBody, loopBody) => 'void setup() {\n' + setupBody + '\n}\n\nvoid loop() {\n' + loopBody + '\n}\n';
const STARTER = SK('  // put your setup code here, to run once:\n', '  // put your main code here, to run repeatedly:\n');

const ON = 'on', OFF = 'off';
// Pin states at given times (ms). names: {pin: 'the red LED'}
function statesAt(checks, names = {}) {
  return { type: 'fn', fn: (run, h) => {
    for (const [t, pins] of checks) {
      for (const [p, want] of Object.entries(pins)) {
        const got = h.stateAt(+p, t);
        const label = names[p] || 'pin ' + p;
        if (typeof want === 'number' && want > 1) {
          if (got !== want) return 'At ' + (t / 1000).toFixed(1) + ' s, ' + label + ' should be at speed ' + want + ', but it was ' + got + '.';
        } else if ((got ? 1 : 0) !== want) {
          return 'At ' + (t / 1000).toFixed(1) + ' s, ' + label + ' should be ' + (want ? ON : OFF) + ', but it was ' + (got ? ON : OFF) + '.';
        }
      }
    }
    return true;
  } };
}
function servoAt(pin, checks) {
  return { type: 'fn', fn: (run) => {
    for (const [t, want] of checks) {
      let a = null;
      for (const s of run.ev.servos) if (s.pin === pin && s.t <= t) a = s.angle;
      if (a === null) return 'At ' + (t / 1000).toFixed(1) + ' s, the servo on pin ' + pin + ' hadn\'t been moved yet.';
      if (Math.abs(a - want) > 1) return 'At ' + (t / 1000).toFixed(1) + ' s, the servo should be at ' + want + '°, but it was at ' + a + '°.';
    }
    return true;
  } };
}
const rises = pin => run => run.ev.writes.filter((w, i, all) => {
  if (w.pin !== pin || w.kind !== 'D' || w.v !== 1) return false;
  const prev = all.slice(0, i).filter(x => x.pin === pin).pop();
  return !prev || prev.v === 0;
}).length;

export default [
// ───────────────────────── UNIT 1 ─────────────────────────
{ id: 'u1', title: 'Your first sketch', exercises: [
  {
    id: 'u1-1', title: 'Hello, Arduino',
    learn: `
<p>An Arduino program is called a <strong>sketch</strong>. Every sketch has two required parts:</p>
<pre><code>void setup() {
  // runs ONCE when the board powers on
}

void loop() {
  // runs over and over, forever
}</code></pre>
<p>The board talks to your computer through the <strong>Serial Monitor</strong>. You start that connection in <code>setup</code>, at a speed (the <em>baud rate</em>) that the monitor also uses. 9600 is the usual choice:</p>
<pre><code>Serial.begin(9600);
Serial.println("Robot online");</code></pre>
<ul>
<li>Text goes in double quotes.</li>
<li>Every statement ends with a semicolon <code>;</code>.</li>
<li>Capitals matter: <code>Serial</code> works, <code>serial</code> doesn't.</li>
</ul>
<p>Press <strong>Run</strong> (or Ctrl+Enter). Your sketch is compiled by a real C++ compiler and runs on a simulated Arduino Uno.</p>`,
    tasks: [
      { text: 'In <strong>setup</strong>, start the Serial connection at 9600 baud', tests: [{ type: 'began', baud: 9600 }] },
      { text: 'Then print exactly <code>Hello, Arduino</code> once', tests: [{ type: 'serial', expected: 'Hello, Arduino' }] }
    ],
    starter: STARTER,
    hint: 'Both lines go inside setup\'s curly braces, because setup runs once. Start Serial first, then print. loop can stay empty.',
    solution: SK('  Serial.begin(9600);\n  Serial.println("Hello, Arduino");', '')
  },
  {
    id: 'u1-2', title: 'print vs println',
    learn: `
<p><code>Serial.println</code> prints and then moves to a <strong>new line</strong>. <code>Serial.print</code> (no "ln") stays on the same line, so the next output continues right after it:</p>
<pre><code>Serial.print("Motor ");
Serial.print("speed: ");
Serial.println("fast");
// Motor speed: fast</code></pre>
<p>Spaces only appear if you put them inside the quotes yourself.</p>`,
    tasks: [
      { text: 'Start Serial at 9600 baud in setup', tests: [{ type: 'began', baud: 9600 }] },
      { text: 'Using <strong>print</strong> three times, print 3, 2 and 1 on one line, each followed by a space', tests: [{ type: 'codeCount', pattern: 'Serial\\.print\\s*\\(', min: 3, msg: 'Use print (without "ln") at least three times so the numbers stay on one line.' }] },
      { text: 'Finish the line with <strong>Liftoff!</strong> so the output is <code>3 2 1 Liftoff!</code>', tests: [{ type: 'serial', expected: '3 2 1 Liftoff!' }] }
    ],
    starter: STARTER,
    hint: 'Everything goes in setup so it only prints once. The last statement should be the one that ends the line.',
    solution: SK('  Serial.begin(9600);\n  Serial.print("3 ");\n  Serial.print("2 ");\n  Serial.print("1 ");\n  Serial.println("Liftoff!");', '')
  },
  {
    id: 'u1-3', title: 'loop runs forever',
    learn: `
<p>Code in <code>loop</code> runs again as soon as it finishes, thousands of times per second. To slow it down, pause with <code>delay</code>, which takes a time in <strong>milliseconds</strong> (1000 ms = 1 second):</p>
<pre><code>void loop() {
  Serial.println("Scanning...");
  delay(2000);   // wait 2 seconds
}</code></pre>
<p>This simulator runs your sketch for a set amount of simulated time (shown in the status bar), then stops. Here it runs for 5 seconds.</p>`,
    scenario: { limit: 5000 },
    tasks: [
      { text: 'Start Serial at 9600 baud in setup', tests: [{ type: 'began', baud: 9600 }] },
      { text: 'In <strong>loop</strong>, print <code>tick</code> on its own line once every second', tests: [{ type: 'code', pattern: 'delay\\s*\\(\\s*1000\\s*\\)', msg: 'Pause for one second (1000 ms) after each print.' }, { type: 'serial', expected: 'tick\ntick\ntick\ntick\ntick', msg: 'In 5 simulated seconds, that should print tick 5 times.' }] }
    ],
    starter: STARTER,
    hint: 'loop needs two statements: the print, then a one-second pause. Remember delay counts in milliseconds.',
    solution: SK('  Serial.begin(9600);', '  Serial.println("tick");\n  delay(1000);')
  },
  {
    id: 'u1-4', title: 'Bug hunt',
    learn: `
<p>When code breaks the rules, the compiler refuses to upload it and shows an <strong>error</strong> with a line number. Reading errors is a core skill. Below the Serial Monitor, this site explains each one in plain English, and you can click the line number to jump to it.</p>
<p>You'll also see <strong>comments</strong>. The compiler ignores them; they're notes for people:</p>
<pre><code>// a single-line comment
/* a comment
   over several lines */</code></pre>`,
    tasks: [
      { text: 'Fix the three bugs so the sketch compiles', tests: [{ type: 'began', msg: 'Get the sketch compiling and starting Serial.' }] },
      { text: 'It should print the three lines exactly as written', tests: [{ type: 'serial', expected: 'Bugs are normal\nRead the error\nFix the first one first' }] }
    ],
    starter: 'void setup() {\n  // There are 3 bugs here. Run it and read the errors.\n  Serial.begin(9600);\n  Serial.println("Bugs are normal")\n  serial.println("Read the error");\n  Serial.println("Fix the first one first);\n}\n\nvoid loop() {\n}\n',
    hint: 'One line is missing its semicolon, one has the wrong capitalisation, and one String is missing its closing quote.',
    solution: SK('  Serial.begin(9600);\n  Serial.println("Bugs are normal");\n  Serial.println("Read the error");\n  Serial.println("Fix the first one first");', '')
  }
]},

// ───────────────────────── UNIT 2 ─────────────────────────
{ id: 'u2', title: 'Variables', exercises: [
  {
    id: 'u2-1', title: 'Storing a number',
    learn: `
<p>A <strong>variable</strong> is a named box that holds a value. You must say what <em>type</em> of value it holds:</p>
<pre><code>int motorSpeed = 180;</code></pre>
<ul>
<li><code>int</code> is the type (a whole number; on an Uno it can hold −32,768 to 32,767)</li>
<li><code>motorSpeed</code> is the name</li>
<li><code>= 180</code> puts 180 in the box</li>
</ul>
<p>Print a variable using its name <strong>without quotes</strong>. With quotes, you'd print the word itself.</p>
<p>A variable created <em>outside</em> any function (at the top of the sketch) can be used in both setup and loop. One created inside a function only exists in that function.</p>`,
    tasks: [
      { text: 'Create a whole-number variable called <strong>sensorCount</strong> that holds 12', tests: [{ type: 'code', pattern: '\\bint\\s+sensorCount\\s*=\\s*12\\s*;', msg: 'Create an int variable named sensorCount holding 12.' }] },
      { text: 'Start Serial and print the variable (not the number typed directly)', tests: [{ type: 'began' }, { type: 'code', pattern: 'print(ln)?\\s*\\(\\s*sensorCount\\s*\\)', msg: 'Print the variable by its name, without quotes.' }, { type: 'serial', expected: '12' }] }
    ],
    starter: STARTER,
    hint: 'Create the variable in setup (or at the top), start Serial, then print it by name.',
    solution: SK('  int sensorCount = 12;\n  Serial.begin(9600);\n  Serial.println(sensorCount);', '')
  },
  {
    id: 'u2-2', title: 'Types',
    learn: `
<p>The types you'll use most on Arduino:</p>
<table>
<tr><th>Type</th><th>Holds</th><th>Example</th></tr>
<tr><td><code>int</code></td><td>whole numbers</td><td><code>int lives = 3;</code></td></tr>
<tr><td><code>long</code></td><td>big whole numbers (for time in ms)</td><td><code>long distance = 120000;</code></td></tr>
<tr><td><code>float</code></td><td>decimal numbers</td><td><code>float voltage = 3.3;</code></td></tr>
<tr><td><code>bool</code></td><td><code>true</code> or <code>false</code></td><td><code>bool armed = false;</code></td></tr>
<tr><td><code>char</code></td><td>one character, single quotes</td><td><code>char mode = 'X';</code></td></tr>
<tr><td><code>String</code></td><td>text, double quotes</td><td><code>String team = "Titans";</code></td></tr>
</table>
<p>Two Arduino quirks: printing a <code>float</code> shows <strong>2 decimal places</strong> by default, and printing a <code>bool</code> shows <code>1</code> for true and <code>0</code> for false.</p>`,
    tasks: [
      { text: 'Create a decimal variable <strong>price</strong> holding 4.99', tests: [{ type: 'code', pattern: '\\bfloat\\s+price\\s*=\\s*4\\.99\\s*;', msg: 'Missing a float variable named price holding 4.99.' }] },
      { text: 'Create a true/false variable <strong>inStock</strong> holding true', tests: [{ type: 'code', pattern: '\\bbool(ean)?\\s+inStock\\s*=\\s*true\\s*;', msg: 'Missing a bool variable named inStock holding true.' }] },
      { text: 'Create a single-character variable <strong>grade</strong> holding the letter A', tests: [{ type: 'code', pattern: "\\bchar\\s+grade\\s*=\\s*'A'\\s*;", msg: 'Missing a char variable named grade holding A. A char uses single quotes.' }] },
      { text: 'Create a text variable <strong>board</strong> holding Uno', tests: [{ type: 'code', pattern: '\\bString\\s+board\\s*=\\s*"Uno"\\s*;', msg: 'Missing a String variable named board holding Uno.' }] },
      { text: 'Print all four, each on its own line, in that order', tests: [{ type: 'serial', expected: '4.99\n1\nA\nUno' }] }
    ],
    starter: STARTER,
    hint: 'Create all four, start Serial, then print each by name. Notice what a bool prints as.',
    solution: SK('  float price = 4.99;\n  bool inStock = true;\n  char grade = \'A\';\n  String board = "Uno";\n  Serial.begin(9600);\n  Serial.println(price);\n  Serial.println(inStock);\n  Serial.println(grade);\n  Serial.println(board);', '')
  },
  {
    id: 'u2-3', title: 'Changing values',
    learn: `
<p>Once a variable exists, give it a new value without repeating the type (that would create a second variable):</p>
<pre><code>int battery = 100;
battery = 80;            // now 80
battery = battery - 5;   // now 75</code></pre>
<p>Shortcuts:</p>
<pre><code>battery += 10;   // add 10
battery -= 10;   // subtract 10
battery++;       // add 1
battery--;       // subtract 1</code></pre>`,
    tasks: [
      { text: 'Create a whole-number variable <strong>coins</strong> starting at 10', tests: [{ type: 'code', pattern: '\\bint\\s+coins\\s*=\\s*10\\s*;', msg: 'Start with an int named coins holding 10.' }] },
      { text: 'Add 5 with the add-and-assign shortcut', tests: [{ type: 'code', pattern: 'coins\\s*\\+=\\s*5\\s*;', msg: 'Add 5 to coins with the add-and-assign shortcut.' }] },
      { text: 'Subtract 3 with the subtract-and-assign shortcut', tests: [{ type: 'code', pattern: 'coins\\s*-=\\s*3\\s*;', msg: 'Subtract 3 with the subtract-and-assign shortcut.' }] },
      { text: 'Add 1 with the increment shortcut, then print <strong>coins</strong>', tests: [{ type: 'code', pattern: 'coins\\s*\\+\\+|\\+\\+\\s*coins', msg: 'Add 1 with the increment shortcut.' }, { type: 'serial', expected: '13' }] }
    ],
    starter: STARTER,
    hint: '10 + 5 − 3 + 1 = 13. Each change goes on its own line, and none of them repeat the type.',
    solution: SK('  Serial.begin(9600);\n  int coins = 10;\n  coins += 5;\n  coins -= 3;\n  coins++;\n  Serial.println(coins);', '')
  },
  {
    id: 'u2-4', title: 'Labels and values',
    learn: `
<p>To print a label next to a value, print the pieces one after another on the same line:</p>
<pre><code>int rpm = 3200;
Serial.print("RPM: ");
Serial.println(rpm);       // RPM: 3200</code></pre>
<p><strong>Trap:</strong> in C++, <code>"RPM: " + rpm</code> does <em>not</em> join the text and the number. Plain text in quotes isn't a <code>String</code>, so the <code>+</code> does something unexpected (it skips characters). If you want to join with <code>+</code>, start with a String:</p>
<pre><code>Serial.println(String("RPM: ") + rpm);   // works</code></pre>`,
    tasks: [
      { text: 'Create a whole-number variable <strong>temp</strong> holding 21', tests: [{ type: 'code', pattern: '\\bint\\s+temp\\s*=\\s*21\\s*;', msg: 'Missing an int named temp holding 21.' }] },
      { text: 'Print <code>Temperature: 21 C</code> on one line, using the variable for the number', tests: [{ type: 'code', pattern: '\\(\\s*temp\\s*\\)|\\+\\s*temp\\b', msg: 'Use the temp variable for the number, not 21 typed in.' }, { type: 'notCode', pattern: '"[^"]*"\\s*\\+\\s*temp', msg: 'Plain text + a number doesn\'t join them in C++. Print the pieces separately.' }, { type: 'serial', expected: 'Temperature: 21 C' }] }
    ],
    starter: STARTER,
    hint: 'Three pieces on one line: the label (with a space at the end), the variable, and the unit (with a space at the start). Only the last one should end the line.',
    solution: SK('  Serial.begin(9600);\n  int temp = 21;\n  Serial.print("Temperature: ");\n  Serial.print(temp);\n  Serial.println(" C");', '')
  }
]},

// ───────────────────────── UNIT 3 ─────────────────────────
{ id: 'u3', title: 'Math', exercises: [
  {
    id: 'u3-1', title: 'Arithmetic',
    learn: `
<p>Arduino does math with <code>+ - * /</code> and <code>%</code> (remainder).</p>
<p><strong>Watch out:</strong> when both numbers are whole numbers, division throws away the decimal part:</p>
<pre><code>Serial.println(9 / 4);     // 2   (not 2.25)
Serial.println(9 % 4);     // 1   (remainder)
Serial.println(9 / 4.0);   // 2.25 (one side is a decimal)</code></pre>
<p><code>%</code> is handy for patterns: a number is even when the remainder after dividing by 2 is 0.</p>`,
    tasks: [
      { text: 'Have the board calculate and print 7 divided by 2 using whole numbers', tests: [{ type: 'code', pattern: '7\\s*/\\s*2(?![\\d.])', msg: 'Print the division itself, not the answer you worked out.' }] },
      { text: 'Print the remainder of 7 divided by 2', tests: [{ type: 'code', pattern: '7\\s*%\\s*2', msg: 'Use the remainder operator on 7 and 2.' }] },
      { text: 'Print 7 divided by 2.0', tests: [{ type: 'code', pattern: '7\\s*/\\s*2\\.0', msg: 'Divide 7 by the decimal 2.0 this time.' }, { type: 'serial', expected: '3\n1\n3.50' }] }
    ],
    starter: STARTER,
    hint: 'Start Serial, then put each calculation straight inside a print, with no quotes. A float prints with 2 decimals.',
    solution: SK('  Serial.begin(9600);\n  Serial.println(7 / 2);\n  Serial.println(7 % 2);\n  Serial.println(7 / 2.0);', '')
  },
  {
    id: 'u3-2', title: 'Casting and decimals',
    learn: `
<p>If two whole-number variables need a decimal answer, <strong>cast</strong> one to <code>float</code> first:</p>
<pre><code>int distance = 25;
int seconds = 2;
Serial.println(distance / seconds);           // 12
Serial.println((float) distance / seconds);   // 12.50</code></pre>
<p>To choose how many decimals a float prints, add a second value to print: <code>Serial.println(3.14159, 4)</code> prints <code>3.1416</code>.</p>`,
    tasks: [
      { text: 'Create whole-number variables <strong>total</strong> (17) and <strong>trials</strong> (4)', tests: [{ type: 'code', pattern: '\\bint\\s+total\\s*=\\s*17\\s*;', msg: 'Missing an int named total holding 17.' }, { type: 'code', pattern: '\\bint\\s+trials\\s*=\\s*4\\s*;', msg: 'Missing an int named trials holding 4.' }] },
      { text: 'Print the exact average (total ÷ trials), casting to float so the decimals survive', tests: [{ type: 'code', pattern: '\\(\\s*float\\s*\\)|\\(\\s*double\\s*\\)', msg: 'Cast one value to float before dividing.' }, { type: 'serialRegex', pattern: '^4\\.25$', msg: 'The first line should be 4.25' }] },
      { text: 'On the next line, print the same average with 3 decimal places', tests: [{ type: 'serial', expected: '4.25\n4.250' }] }
    ],
    starter: STARTER,
    hint: 'Cast total right before the division. For the second line, the number of decimals goes after a comma inside the print.',
    solution: SK('  Serial.begin(9600);\n  int total = 17;\n  int trials = 4;\n  Serial.println((float) total / trials);\n  Serial.println((float) total / trials, 3);', '')
  },
  {
    id: 'u3-3', title: 'map and constrain',
    learn: `
<p>Sensors and outputs use different ranges. An analog sensor reads <strong>0 to 1023</strong>, but an LED brightness goes <strong>0 to 255</strong> and a servo <strong>0 to 180</strong>. <code>map</code> converts between ranges:</p>
<pre><code>// map(value, fromLow, fromHigh, toLow, toHigh)
int angle = map(512, 0, 1023, 0, 180);   // 90</code></pre>
<p><code>map</code> uses whole-number math, so it drops decimals. <code>constrain</code> clamps a value into a range:</p>
<pre><code>int speed = constrain(300, 0, 255);   // 255
int speed2 = constrain(-20, 0, 255);  // 0</code></pre>`,
    tasks: [
      { text: 'Use map to convert a sensor reading of 700 (range 0–1023) to the brightness range 0–255, and print it', tests: [{ type: 'code', pattern: '\\bmap\\s*\\(', msg: 'Use map.' }, { type: 'serialRegex', pattern: '^174$', msg: 'The first line should be 174.' }] },
      { text: 'Use constrain to clamp 300 into 0–255, and print it', tests: [{ type: 'code', pattern: '\\bconstrain\\s*\\(', msg: 'Use constrain.' }, { type: 'serial', expected: '174\n255' }] }
    ],
    starter: STARTER,
    hint: 'map takes five values: the reading, the range it comes from, then the range you want. constrain takes three: the value, the lowest allowed, the highest allowed.',
    solution: SK('  Serial.begin(9600);\n  Serial.println(map(700, 0, 1023, 0, 255));\n  Serial.println(constrain(300, 0, 255));', '')
  },
  {
    id: 'u3-4', title: 'Project: unit converter',
    learn: `
<p>Combine what you know. The formula from Celsius to Fahrenheit:</p>
<p class="formula">F = C × 9 / 5 + 32</p>
<p>Use <code>float</code> variables so decimals survive. Remember a float prints with 2 decimals.</p>`,
    tasks: [
      { text: 'Create a decimal variable <strong>celsius</strong> holding 25', tests: [{ type: 'code', pattern: '\\b(float|double)\\s+celsius\\s*=\\s*25(\\.0*)?\\s*;', msg: 'Missing a float named celsius holding 25.' }] },
      { text: 'Create a decimal variable <strong>fahrenheit</strong>, calculated from celsius with the formula', tests: [{ type: 'code', pattern: '\\b(float|double)\\s+fahrenheit\\s*=[^;]*\\bcelsius\\b', msg: 'Create a float named fahrenheit worked out from celsius.' }] },
      { text: 'Print <code>25.00 C = 77.00 F</code> using both variables', tests: [{ type: 'serial', expected: '25.00 C = 77.00 F' }] }
    ],
    starter: STARTER,
    hint: 'Turn the formula into C++ with * and /. Then print four pieces on one line: celsius, the middle text, fahrenheit, and the final letter.',
    solution: SK('  Serial.begin(9600);\n  float celsius = 25;\n  float fahrenheit = celsius * 9 / 5 + 32;\n  Serial.print(celsius);\n  Serial.print(" C = ");\n  Serial.print(fahrenheit);\n  Serial.println(" F");', '')
  }
]},

// ───────────────────────── UNIT 4 ─────────────────────────
{ id: 'u4', title: 'LEDs and outputs', exercises: [
  {
    id: 'u4-1', title: 'Blink',
    learn: `
<p>Each pin on the board can be an <strong>output</strong> (the board sets it HIGH = 5 V or LOW = 0 V) or an <strong>input</strong> (the board reads it). Set this up once in <code>setup</code>:</p>
<pre><code>pinMode(7, OUTPUT);</code></pre>
<p>Then switch it on and off:</p>
<pre><code>digitalWrite(7, HIGH);   // on
digitalWrite(7, LOW);    // off</code></pre>
<p>The Uno has an LED built in, wired to pin 13. Its name is <code>LED_BUILTIN</code>.</p>
<p>Open the <strong>Board</strong> tab after running to watch the LED and a timeline of every pin.</p>`,
    scenario: { limit: 6000 },
    tasks: [
      { text: 'Set the built-in LED\'s pin as an output', tests: [{ type: 'pinMode', pin: 13, mode: 1 }] },
      { text: 'Make it blink forever: on for 1 second, off for 1 second', tests: [{ type: 'blink', pin: 13, on: 1000, off: 1000 }] }
    ],
    starter: STARTER,
    hint: 'setup only sets the pin\'s mode. loop needs four statements: on, wait, off, wait.',
    solution: SK('  pinMode(LED_BUILTIN, OUTPUT);', '  digitalWrite(LED_BUILTIN, HIGH);\n  delay(1000);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(1000);')
  },
  {
    id: 'u4-2', title: 'One variable, one change',
    learn: `
<p>If the same number appears in several places, put it in a variable. Then one change updates everything:</p>
<pre><code>int pauseTime = 750;

void loop() {
  Serial.println("ping");
  delay(pauseTime);
}</code></pre>
<p>A variable at the top of the sketch (outside setup and loop) is visible everywhere.</p>`,
    scenario: { limit: 3000 },
    tasks: [
      { text: 'At the top of the sketch, create a whole-number variable <strong>blinkTime</strong> holding 250', tests: [{ type: 'code', pattern: '\\b(int|long|unsigned\\s+long)\\s+blinkTime\\s*=\\s*250\\s*;', msg: 'Create a variable named blinkTime holding 250.' }] },
      { text: 'Blink the built-in LED using <strong>blinkTime</strong> for both pauses', tests: [{ type: 'codeCount', pattern: 'delay\\s*\\(\\s*blinkTime\\s*\\)', min: 2, msg: 'Both pauses should use blinkTime instead of a typed number.' }, { type: 'pinMode', pin: 13, mode: 1 }, { type: 'blink', pin: 13, on: 250, off: 250 }] }
    ],
    starter: STARTER,
    hint: 'Same structure as Blink, with the variable name inside both pauses.',
    solution: 'int blinkTime = 250;\n\n' + SK('  pinMode(LED_BUILTIN, OUTPUT);', '  digitalWrite(LED_BUILTIN, HIGH);\n  delay(blinkTime);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(blinkTime);')
  },
  {
    id: 'u4-3', title: 'Heartbeat',
    learn: `
<p>The on and off times don't have to match. A short flash with a long gap is a classic "I'm alive" signal on robots.</p>`,
    scenario: { limit: 5000 },
    tasks: [
      { text: 'Make the built-in LED flash on for 100 ms, then off for 900 ms, repeating', tests: [{ type: 'pinMode', pin: 13, mode: 1 }, { type: 'blink', pin: 13, on: 100, off: 900 }] }
    ],
    starter: STARTER,
    hint: 'Same as Blink, with two different pause lengths.',
    solution: SK('  pinMode(LED_BUILTIN, OUTPUT);', '  digitalWrite(LED_BUILTIN, HIGH);\n  delay(100);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(900);')
  },
  {
    id: 'u4-4', title: 'An external LED',
    learn: `
<p>External LEDs connect to a pin through a resistor. Name the pin with a <strong>constant</strong>, a variable that can't change. If you rewire later, you only edit one line:</p>
<pre><code>const int BUZZER_PIN = 8;

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
}</code></pre>
<p>Constants are usually written in CAPITALS.</p>`,
    scenario: { limit: 3000 },
    tasks: [
      { text: 'Create a constant <strong>LED_PIN</strong> for pin 9', tests: [{ type: 'code', pattern: '\\bconst\\s+(int|byte)\\s+LED_PIN\\s*=\\s*9\\s*;', msg: 'Create a constant int named LED_PIN for pin 9.' }] },
      { text: 'Using the constant everywhere, make the LED on pin 9 blink 300 ms on, 300 ms off', tests: [{ type: 'notCode', pattern: '(pinMode|digitalWrite)\\s*\\(\\s*9\\b', msg: 'Use LED_PIN instead of typing 9.' }, { type: 'pinMode', pin: 9, mode: 1 }, { type: 'blink', pin: 9, on: 300, off: 300 }] }
    ],
    starter: STARTER,
    hint: 'The constant goes above setup. Then every place that sets up or switches the pin uses the constant\'s name instead of the number.',
    solution: 'const int LED_PIN = 9;\n\n' + SK('  pinMode(LED_PIN, OUTPUT);', '  digitalWrite(LED_PIN, HIGH);\n  delay(300);\n  digitalWrite(LED_PIN, LOW);\n  delay(300);')
  },
  {
    id: 'u4-5', title: 'Project: traffic light',
    learn: `
<p>Several outputs at once. Each LED gets its own pin, and you control exactly which are on at each moment.</p>
<p>Wiring for this project:</p>
<ul><li>Red LED on pin 2</li><li>Yellow LED on pin 3</li><li>Green LED on pin 4</li></ul>
<p>Make sure only one light is on at a time: turn the old one off when you turn the next one on.</p>`,
    scenario: { limit: 9000 },
    tasks: [
      { text: 'Set pins 2, 3 and 4 as outputs', tests: [{ type: 'pinMode', pin: 2, mode: 1 }, { type: 'pinMode', pin: 3, mode: 1 }, { type: 'pinMode', pin: 4, mode: 1 }] },
      { text: 'Repeat forever: green alone for 3 s, then yellow alone for 1 s, then red alone for 3 s', tests: [statesAt([
        [1000, { 4: 1, 3: 0, 2: 0 }], [2900, { 4: 1, 3: 0, 2: 0 }], [3500, { 4: 0, 3: 1, 2: 0 }],
        [5000, { 4: 0, 3: 0, 2: 1 }], [6900, { 2: 1, 3: 0, 4: 0 }], [8000, { 4: 1, 3: 0, 2: 0 }]
      ], { 2: 'red (pin 2)', 3: 'yellow (pin 3)', 4: 'green (pin 4)' })] }
    ],
    starter: STARTER,
    hint: 'In loop, each phase turns one LED on, turns the previous one off, then waits. Three phases, three waits.',
    solution: 'const int RED = 2;\nconst int YELLOW = 3;\nconst int GREEN = 4;\n\n' + SK('  pinMode(RED, OUTPUT);\n  pinMode(YELLOW, OUTPUT);\n  pinMode(GREEN, OUTPUT);',
      '  digitalWrite(RED, LOW);\n  digitalWrite(GREEN, HIGH);\n  delay(3000);\n  digitalWrite(GREEN, LOW);\n  digitalWrite(YELLOW, HIGH);\n  delay(1000);\n  digitalWrite(YELLOW, LOW);\n  digitalWrite(RED, HIGH);\n  delay(3000);')
  }
]},

// ───────────────────────── UNIT 5 ─────────────────────────
{ id: 'u5', title: 'Decisions and inputs', exercises: [
  {
    id: 'u5-1', title: 'if / else',
    learn: `
<p>An <code>if</code> runs code only when a condition is true. <code>else</code> runs when it's false:</p>
<pre><code>int battery = 15;
if (battery &lt; 20) {
  Serial.println("Low battery");
} else {
  Serial.println("Battery OK");
}</code></pre>
<p>Comparisons: <code>==</code> equal (two signs; one <code>=</code> stores a value), <code>!=</code> not equal, <code>&lt;</code> <code>&gt;</code> <code>&lt;=</code> <code>&gt;=</code>.</p>`,
    tasks: [
      { text: 'Create a whole-number variable <strong>temperature</strong> holding 30', tests: [{ type: 'code', pattern: '\\bint\\s+temperature\\s*=\\s*30\\s*;', msg: 'Missing an int named temperature holding 30.' }] },
      { text: 'If temperature is above 25, print <code>Fan on</code>; otherwise print <code>Fan off</code>', tests: [{ type: 'code', pattern: 'if\\s*\\(\\s*temperature\\s*>\\s*25\\s*\\)', msg: 'Use an if that checks whether temperature is greater than 25.' }, { type: 'code', pattern: '\\belse\\b', msg: 'Add an else for the other case.' }, { type: 'code', pattern: '"Fan off"', msg: 'The else should print Fan off.' }, { type: 'serial', expected: 'Fan on' }] }
    ],
    starter: STARTER,
    hint: 'Follow the shape of the battery example: change the variable, the condition and both messages.',
    solution: SK('  Serial.begin(9600);\n  int temperature = 30;\n  if (temperature > 25) {\n    Serial.println("Fan on");\n  } else {\n    Serial.println("Fan off");\n  }', '')
  },
  {
    id: 'u5-2', title: 'else if',
    learn: `
<p>Chain checks with <code>else if</code>. They're tested top to bottom and <strong>only the first true one</strong> runs:</p>
<pre><code>int distance = 40;   // cm
if (distance &lt; 10) {
  Serial.println("STOP");
} else if (distance &lt; 50) {
  Serial.println("Slow");
} else {
  Serial.println("Full speed");
}</code></pre>
<p>40 isn't under 10, but it is under 50, so this prints <code>Slow</code>. Order matters.</p>`,
    tasks: [
      { text: 'Create a whole-number variable <strong>battery</strong> holding 35', tests: [{ type: 'code', pattern: '\\bint\\s+battery\\s*=\\s*35\\s*;', msg: 'Missing an int named battery holding 35.' }] },
      { text: 'Print the status: 75 or more is <code>Full</code>, 50 or more is <code>Good</code>, 20 or more is <code>Low</code>, anything else is <code>Critical</code>', tests: [{ type: 'codeCount', pattern: 'else\\s+if', min: 2, msg: 'Use an if, at least two else-if branches, and a final else.' }, { type: 'code', pattern: '"Critical"', msg: 'The final else should print Critical.' }, { type: 'serial', expected: 'Low' }] }
    ],
    starter: STARTER,
    hint: 'Check from the highest level down: 75 first, then 50, then 20, then everything else.',
    solution: SK('  Serial.begin(9600);\n  int battery = 35;\n  if (battery >= 75) {\n    Serial.println("Full");\n  } else if (battery >= 50) {\n    Serial.println("Good");\n  } else if (battery >= 20) {\n    Serial.println("Low");\n  } else {\n    Serial.println("Critical");\n  }', '')
  },
  {
    id: 'u5-3', title: 'Reading a button',
    learn: `
<p>To read a button, set its pin as an input and use <code>digitalRead</code>, which gives back <code>HIGH</code> or <code>LOW</code>.</p>
<p>The simplest wiring connects the button between the pin and ground, and turns on the board's internal <strong>pull-up</strong> resistor:</p>
<pre><code>pinMode(6, INPUT_PULLUP);</code></pre>
<p>With a pull-up, the logic is <strong>backwards</strong>: the pin reads <code>HIGH</code> when the button is <em>not</em> pressed and <code>LOW</code> when it <em>is</em>.</p>
<pre><code>if (digitalRead(6) == LOW) {
  // button is pressed
}</code></pre>`,
    scenario: { limit: 4000, digital: [[2, 1000, 0], [2, 3000, 1]] },
    inputs: 'A button on pin 2 (wired for <code>INPUT_PULLUP</code>) is pressed from 1.0 s to 3.0 s.',
    tasks: [
      { text: 'Set pin 2 as an input with the pull-up resistor, and the built-in LED as an output', tests: [{ type: 'pinMode', pin: 2, mode: 2 }, { type: 'pinMode', pin: 13, mode: 1 }] },
      { text: 'In loop, keep the LED on while the button is pressed and off while it isn\'t', tests: [{ type: 'code', pattern: 'digitalRead\\s*\\(', msg: 'Read the button with digitalRead.' }, statesAt([[500, { 13: 0 }], [1500, { 13: 1 }], [2900, { 13: 1 }], [3500, { 13: 0 }]], { 13: 'the LED' })] }
    ],
    starter: STARTER,
    hint: 'Remember the pull-up logic: pressed reads LOW. Use an if/else that turns the LED on in one branch and off in the other.',
    solution: SK('  pinMode(2, INPUT_PULLUP);\n  pinMode(LED_BUILTIN, OUTPUT);', '  if (digitalRead(2) == LOW) {\n    digitalWrite(LED_BUILTIN, HIGH);\n  } else {\n    digitalWrite(LED_BUILTIN, LOW);\n  }')
  },
  {
    id: 'u5-4', title: 'AND, OR, NOT',
    learn: `
<p>Combine conditions:</p>
<ul>
<li><code>&amp;&amp;</code> (AND): true only if <strong>both</strong> sides are true</li>
<li><code>||</code> (OR): true if <strong>either</strong> side is true</li>
<li><code>!</code> (NOT): flips true and false</li>
</ul>
<pre><code>if (armed &amp;&amp; distance &lt; 30) {
  Serial.println("Target in range");
}</code></pre>
<p>Robots use this for safety interlocks: a motor only runs if two separate conditions agree.</p>`,
    scenario: { limit: 5000, digital: [[2, 1000, 0], [2, 4000, 1], [3, 2000, 0], [3, 3000, 1]] },
    inputs: 'Two pull-up buttons: pin 2 is pressed from 1.0 s to 4.0 s, and pin 3 is pressed from 2.0 s to 3.0 s.',
    tasks: [
      { text: 'Set pins 2 and 3 as pull-up inputs and the built-in LED as an output', tests: [{ type: 'pinMode', pin: 2, mode: 2 }, { type: 'pinMode', pin: 3, mode: 2 }, { type: 'pinMode', pin: 13, mode: 1 }] },
      { text: 'Turn the LED on only while <strong>both</strong> buttons are pressed', tests: [{ type: 'code', pattern: '&&', msg: 'Join the two checks with AND.' }, statesAt([[500, { 13: 0 }], [1500, { 13: 0 }], [2500, { 13: 1 }], [3500, { 13: 0 }], [4500, { 13: 0 }]], { 13: 'the LED' })] }
    ],
    starter: STARTER,
    hint: 'One if with two digitalRead checks joined by AND. Each check uses the pull-up logic.',
    solution: SK('  pinMode(2, INPUT_PULLUP);\n  pinMode(3, INPUT_PULLUP);\n  pinMode(LED_BUILTIN, OUTPUT);', '  if (digitalRead(2) == LOW && digitalRead(3) == LOW) {\n    digitalWrite(LED_BUILTIN, HIGH);\n  } else {\n    digitalWrite(LED_BUILTIN, LOW);\n  }')
  },
  {
    id: 'u5-5', title: 'Analog sensors',
    learn: `
<p>Analog pins <code>A0</code>–<code>A5</code> measure a voltage and give back a number from <strong>0</strong> (0 V) to <strong>1023</strong> (5 V). Light sensors, potentiometers and distance sensors work this way.</p>
<pre><code>int level = analogRead(A2);
Serial.println(level);</code></pre>
<p>You don't need <code>pinMode</code> to read an analog pin.</p>`,
    scenario: { limit: 5000, analog: [[0, 0, 800], [0, 2000, 150], [0, 4000, 600]] },
    inputs: 'A light sensor on A0 reads 800 (bright) until 2.0 s, then 150 (dark) until 4.0 s, then 600.',
    tasks: [
      { text: 'Build a night light: read A0, and turn the built-in LED on when the reading is below 300, off otherwise', tests: [{ type: 'code', pattern: 'analogRead\\s*\\(\\s*A0\\s*\\)', msg: 'Read the sensor with analogRead on A0.' }, { type: 'pinMode', pin: 13, mode: 1 }, statesAt([[1000, { 13: 0 }], [2500, { 13: 1 }], [3900, { 13: 1 }], [4500, { 13: 0 }]], { 13: 'the LED' })] },
      { text: 'Also start Serial and print each reading, then wait 500 ms', tests: [{ type: 'began' }, { type: 'serialRegex', pattern: '^800$', msg: 'Print the raw reading on its own line.' }, { type: 'serialRegex', pattern: '^150$', msg: 'Print the raw reading on its own line, including while it\'s dark.' }] }
    ],
    starter: STARTER,
    hint: 'Store the reading in a variable at the top of loop, print it, use it in an if/else for the LED, then pause.',
    solution: SK('  Serial.begin(9600);\n  pinMode(LED_BUILTIN, OUTPUT);', '  int light = analogRead(A0);\n  Serial.println(light);\n  if (light < 300) {\n    digitalWrite(LED_BUILTIN, HIGH);\n  } else {\n    digitalWrite(LED_BUILTIN, LOW);\n  }\n  delay(500);')
  }
]},

// ───────────────────────── UNIT 6 ─────────────────────────
{ id: 'u6', title: 'Loops', exercises: [
  {
    id: 'u6-1', title: 'for loops',
    learn: `
<p>A <code>for</code> loop repeats a block a set number of times. The counter's start, condition and update all go in one line:</p>
<pre><code>for (int i = 0; i &lt; 3; i++) {
  Serial.print("Lap ");
  Serial.println(i);
}
// Lap 0, Lap 1, Lap 2</code></pre>
<ol><li><strong>start</strong>: runs once</li><li><strong>condition</strong>: checked before each lap</li><li><strong>update</strong>: runs after each lap (it can be anything, like <code>i += 5</code>)</li></ol>`,
    tasks: [
      { text: 'In setup, use a <strong>for</strong> loop to print the numbers 5, 10, 15, 20 and 25, one per line', tests: [{ type: 'code', pattern: '\\bfor\\s*\\(', msg: 'Use a for loop.' }, { type: 'serial', expected: '5\n10\n15\n20\n25' }] }
    ],
    starter: STARTER,
    hint: 'Start the counter at 5, keep going while it\'s 25 or less, and count up by 5 each lap.',
    solution: SK('  Serial.begin(9600);\n  for (int i = 5; i <= 25; i += 5) {\n    Serial.println(i);\n  }', '')
  },
  {
    id: 'u6-2', title: 'Blink a set number of times',
    learn: `
<p>Put a loop in <code>setup</code> to do something a fixed number of times when the board starts, then stop (leave <code>loop</code> empty).</p>
<pre><code>for (int i = 0; i &lt; 4; i++) {
  Serial.println("beep");
  delay(250);
}</code></pre>`,
    scenario: { limit: 4000 },
    tasks: [
      { text: 'At startup, blink the built-in LED exactly 5 times (200 ms on, 200 ms off) using a for loop, then stay off', tests: [{ type: 'code', pattern: '\\bfor\\s*\\(', msg: 'Use a for loop.' }, { type: 'pinMode', pin: 13, mode: 1 }, { type: 'fn', fn: run => rises(13)(run) === 5 || 'The LED should turn on exactly 5 times. It turned on ' + rises(13)(run) + ' time(s).' }, { type: 'blink', pin: 13, on: 200, off: 200, min: 2 }, statesAt([[3500, { 13: 0 }]], { 13: 'the LED' })] }
    ],
    starter: STARTER,
    hint: 'Put the four blink statements inside a for loop that runs 5 times, all in setup.',
    solution: SK('  pinMode(LED_BUILTIN, OUTPUT);\n  for (int i = 0; i < 5; i++) {\n    digitalWrite(LED_BUILTIN, HIGH);\n    delay(200);\n    digitalWrite(LED_BUILTIN, LOW);\n    delay(200);\n  }', '')
  },
  {
    id: 'u6-3', title: 'while: wait for a button',
    learn: `
<p>A <code>while</code> loop repeats <strong>as long as</strong> its condition is true. With an empty body, it just waits:</p>
<pre><code>while (analogRead(A1) &lt; 500) {
  // do nothing until the sensor reads 500 or more
}
Serial.println("Threshold reached");</code></pre>
<p>Careful: if the condition never becomes false, the sketch is stuck forever.</p>`,
    scenario: { limit: 3000, digital: [[2, 2000, 0]] },
    inputs: 'A pull-up button on pin 2 is pressed at 2.0 s and held.',
    tasks: [
      { text: 'Set up Serial, pin 2 as a pull-up input and the built-in LED as an output', tests: [{ type: 'began' }, { type: 'pinMode', pin: 2, mode: 2 }, { type: 'pinMode', pin: 13, mode: 1 }] },
      { text: 'In setup, use a <strong>while</strong> loop to wait until the button is pressed', tests: [{ type: 'code', pattern: '\\bwhile\\s*\\(', msg: 'Use a while loop to wait.' }] },
      { text: 'After the wait, turn the LED on and print <code>Go!</code>', tests: [{ type: 'serial', expected: 'Go!' }, statesAt([[1000, { 13: 0 }], [2500, { 13: 1 }]], { 13: 'the LED' })] }
    ],
    starter: STARTER,
    hint: 'The while condition is "the button is NOT pressed" (pull-up: reads HIGH). Its body can be empty. The LED and print go after the loop.',
    solution: SK('  Serial.begin(9600);\n  pinMode(2, INPUT_PULLUP);\n  pinMode(LED_BUILTIN, OUTPUT);\n  while (digitalRead(2) == HIGH) {\n  }\n  digitalWrite(LED_BUILTIN, HIGH);\n  Serial.println("Go!");', '')
  },
  {
    id: 'u6-4', title: 'Adding things up',
    learn: `
<p>A common pattern: create a variable <strong>before</strong> the loop, add to it on every lap, and print it <strong>after</strong>:</p>
<pre><code>int total = 0;
for (int i = 1; i &lt;= 4; i++) {
  total += i;
}
Serial.println(total);   // 1+2+3+4 = 10</code></pre>`,
    tasks: [
      { text: 'Use a loop to add up every number from 1 to 100', tests: [{ type: 'code', pattern: '\\b(for|while)\\s*\\(', msg: 'Use a loop.' }, { type: 'notCode', pattern: '5050', msg: 'Let the loop calculate it. Don\'t type 5050 yourself.' }] },
      { text: 'Print the total once, after the loop', tests: [{ type: 'serial', expected: '5050' }] }
    ],
    starter: STARTER,
    hint: 'Same pattern as the lesson example: a total starting at 0, a loop that adds to it, and one print after the loop.',
    solution: SK('  Serial.begin(9600);\n  int total = 0;\n  for (int i = 1; i <= 100; i++) {\n    total += i;\n  }\n  Serial.println(total);', '')
  },
  {
    id: 'u6-5', title: 'Fading with PWM',
    learn: `
<p><code>analogWrite</code> fakes an in-between voltage by switching a pin on and off very fast (<strong>PWM</strong>). The value goes from <strong>0</strong> (off) to <strong>255</strong> (fully on), and it controls LED brightness or motor speed.</p>
<p>Only pins marked <code>~</code> on the Uno can do it: 3, 5, 6, 9, 10 and 11.</p>
<pre><code>analogWrite(6, 64);    // about 25% brightness</code></pre>
<p>A for loop that steps the value creates a smooth fade.</p>`,
    scenario: { limit: 6000 },
    tasks: [
      { text: 'Set pin 9 as an output', tests: [{ type: 'pinMode', pin: 9, mode: 1 }] },
      { text: 'In loop, fade the LED on pin 9 up from 0 to 255 in steps of 5, waiting 10 ms per step', tests: [{ type: 'code', pattern: 'analogWrite\\s*\\(', msg: 'Use analogWrite to set the brightness.' }, { type: 'code', pattern: '\\bfor\\s*\\(', msg: 'Use a for loop to step the brightness.' },
        { type: 'fn', fn: run => { const v = run.ev.writes.filter(w => w.pin === 9 && w.kind === 'A').map(w => w.v); if (!v.includes(0) || !v.includes(255)) return 'The brightness on pin 9 should go all the way from 0 to 255.'; for (let i = 1; i < v.length; i++) if (v[i] > v[i - 1] && v[i] - v[i - 1] !== 5) return 'Each step up should be 5 (saw a jump from ' + v[i - 1] + ' to ' + v[i] + ').'; return true; } }] },
      { text: 'Then fade it back down from 255 to 0 the same way', tests: [{ type: 'fn', fn: run => { const v = run.ev.writes.filter(w => w.pin === 9 && w.kind === 'A').map(w => w.v); const i = v.indexOf(255); if (i < 0 || !v.slice(i).includes(0)) return 'After reaching 255, the brightness should come back down to 0.'; for (let k = i + 1; k < v.length && v[k] !== 0; k++) if (v[k - 1] - v[k] !== 5 && v[k] < v[k - 1]) return 'Each step down should be 5.'; return true; } }] }
    ],
    starter: STARTER,
    hint: 'Two for loops in loop: one counting up by 5, one counting down by 5. Each lap writes the brightness and waits.',
    solution: SK('  pinMode(9, OUTPUT);', '  for (int b = 0; b <= 255; b += 5) {\n    analogWrite(9, b);\n    delay(10);\n  }\n  for (int b = 255; b >= 0; b -= 5) {\n    analogWrite(9, b);\n    delay(10);\n  }')
  }
]},

// ───────────────────────── UNIT 7 ─────────────────────────
{ id: 'u7', title: 'Functions', exercises: [
  {
    id: 'u7-1', title: 'Your own function',
    learn: `
<p>A <strong>function</strong> is a named block of code you can run whenever you want by <em>calling</em> it. <code>setup</code> and <code>loop</code> are functions too.</p>
<pre><code>void beepTwice() {
  tone(8, 1000, 100);
  delay(200);
  tone(8, 1000, 100);
  delay(200);
}

void loop() {
  beepTwice();
  delay(1000);
}</code></pre>
<ul>
<li>Functions go <strong>outside</strong> setup and loop.</li>
<li><code>void</code> means the function doesn't give back a value.</li>
<li>Call it with its name and brackets.</li>
</ul>`,
    scenario: { limit: 3000 },
    harness: { signature: 'a function called blinkOnce that takes no inputs and returns nothing', tests: [
      { id: 'b1', pre: 'academy_reset_pins(); unsigned long t0 = millis(); blinkOnce(); unsigned long dt = millis() - t0;', cpp: 'academy_rises(13) == 1 && academy_pin_out(13) == LOW && dt >= 398 && dt <= 402', got: 'String("LED turned on ") + academy_rises(13) + " time(s), took " + dt + " ms"' }
    ]},
    tasks: [
      { text: 'Write a function <strong>blinkOnce</strong> that turns the built-in LED on for 200 ms, then off for 200 ms', tests: [{ type: 'code', pattern: 'void\\s+blinkOnce\\s*\\(\\s*\\)', msg: 'Create a function named blinkOnce that takes no inputs and returns nothing.' }, { type: 'harness', id: 'b1', msg: 'One call to blinkOnce should switch the LED on once and take 400 ms in total, ending with it off.' }] },
      { text: 'Set up the LED pin, and call blinkOnce from loop', tests: [{ type: 'pinMode', pin: 13, mode: 1 }, { type: 'code', pattern: 'blinkOnce\\s*\\(\\s*\\)\\s*;', msg: 'Call blinkOnce inside loop.' }, { type: 'blink', pin: 13, on: 200, off: 200 }] }
    ],
    starter: STARTER,
    hint: 'The function goes after loop\'s closing brace and contains the four blink statements. loop then only needs one line.',
    solution: SK('  pinMode(LED_BUILTIN, OUTPUT);', '  blinkOnce();') + '\nvoid blinkOnce() {\n  digitalWrite(LED_BUILTIN, HIGH);\n  delay(200);\n  digitalWrite(LED_BUILTIN, LOW);\n  delay(200);\n}\n'
  },
  {
    id: 'u7-2', title: 'Parameters',
    learn: `
<p><strong>Parameters</strong> pass values into a function. Declare them like variables, inside the brackets:</p>
<pre><code>void beep(int pitch) {
  tone(8, pitch, 100);
  delay(150);
}

beep(440);
beep(880);</code></pre>
<p>Use commas for more than one: <code>void drive(int speed, int ms)</code>.</p>
<p>The checker also calls your function with its own hidden values, so it has to work for any input, not just the example.</p>`,
    scenario: { limit: 3000 },
    harness: { signature: 'a function called blinkTimes that takes one whole number', tests: [
      { id: 'n4', pre: 'academy_reset_pins(); blinkTimes(4);', cpp: 'academy_rises(13) == 4', got: 'String("blinked ") + academy_rises(13) + " time(s)"' },
      { id: 'n1', pre: 'academy_reset_pins(); blinkTimes(1);', cpp: 'academy_rises(13) == 1', got: 'String("blinked ") + academy_rises(13) + " time(s)"' },
      { id: 'n0', pre: 'academy_reset_pins(); blinkTimes(0);', cpp: 'academy_rises(13) == 0', got: 'String("blinked ") + academy_rises(13) + " time(s)"' }
    ]},
    tasks: [
      { text: 'Write a function <strong>blinkTimes</strong> that takes a whole number and blinks the built-in LED that many times (100 ms on, 100 ms off)', tests: [{ type: 'harness', id: 'n4', msg: 'Given 4, blinkTimes should blink 4 times.' }, { type: 'harness', id: 'n1', msg: 'Given 1, it should blink once.' }, { type: 'harness', id: 'n0', msg: 'Given 0, it shouldn\'t blink at all.' }] },
      { text: 'In setup, blink 3 times, wait 1 second, then blink 2 times', tests: [{ type: 'pinMode', pin: 13, mode: 1 }, { type: 'fn', fn: run => rises(13)(run) === 5 || 'In total the LED should turn on 5 times. It turned on ' + rises(13)(run) + ' time(s).' }, { type: 'fn', fn: (run, h) => h.segments(13).some(s => s.v === 0 && Math.abs(s.dur - 1100) <= 2) || 'There should be a 1-second pause between the 3 blinks and the 2 blinks.' }] }
    ],
    starter: STARTER,
    hint: 'Inside the function, put a for loop that runs as many times as the parameter says, with the four blink statements inside.',
    solution: SK('  pinMode(LED_BUILTIN, OUTPUT);\n  blinkTimes(3);\n  delay(1000);\n  blinkTimes(2);', '') + '\nvoid blinkTimes(int times) {\n  for (int i = 0; i < times; i++) {\n    digitalWrite(LED_BUILTIN, HIGH);\n    delay(100);\n    digitalWrite(LED_BUILTIN, LOW);\n    delay(100);\n  }\n}\n'
  },
  {
    id: 'u7-3', title: 'Return values',
    learn: `
<p>A function can <strong>give back</strong> a value with <code>return</code>. Replace <code>void</code> with the type you return:</p>
<pre><code>float cmToInches(float cm) {
  return cm / 2.54;
}

float d = cmToInches(30);     // 11.81
Serial.println(cmToInches(100));</code></pre>
<p>Returning is more useful than printing, because the caller decides what to do with the result.</p>`,
    harness: { signature: 'a function called toFahrenheit that takes a float and returns a float', tests: [
      { id: 'f0', cpp: 'academy_near(toFahrenheit(0), 32)', got: 'toFahrenheit(0)' },
      { id: 'f100', cpp: 'academy_near(toFahrenheit(100), 212)', got: 'toFahrenheit(100)' },
      { id: 'fm40', cpp: 'academy_near(toFahrenheit(-40), -40)', got: 'toFahrenheit(-40)' },
      { id: 'f37', cpp: 'academy_near(toFahrenheit(37), 98.6)', got: 'toFahrenheit(37)' }
    ]},
    tasks: [
      { text: 'Write a function <strong>toFahrenheit</strong> that takes a decimal Celsius temperature and returns it in Fahrenheit (no printing inside)', tests: [{ type: 'harness', id: 'f0', msg: 'Given 0, it should return 32.' }, { type: 'harness', id: 'f100', msg: 'Given 100, it should return 212.' }, { type: 'harness', id: 'fm40', msg: 'Given -40, it should return -40.' }, { type: 'harness', id: 'f37', msg: 'Given 37, it should return 98.6 (check your division isn\'t whole-number division).' }] },
      { text: 'In setup, print the result for 25', tests: [{ type: 'serial', expected: '77.00' }] }
    ],
    starter: STARTER,
    hint: 'Swap void for the type you\'re returning, and return the formula from the unit converter. In setup, the call can go straight inside the print.',
    solution: SK('  Serial.begin(9600);\n  Serial.println(toFahrenheit(25));', '') + '\nfloat toFahrenheit(float c) {\n  return c * 9.0 / 5.0 + 32;\n}\n'
  },
  {
    id: 'u7-4', title: 'Yes/no functions',
    learn: `
<p>A function that answers a yes/no question returns a <code>bool</code>. A comparison already <em>is</em> true or false, so you can return it directly:</p>
<pre><code>bool isTooClose(int cm) {
  return cm &lt; 15;
}

if (isTooClose(distance)) {
  // stop the robot
}</code></pre>`,
    scenario: { limit: 5000, analog: [[0, 0, 800], [0, 2000, 150], [0, 4000, 600]] },
    inputs: 'A light sensor on A0 reads 800 until 2.0 s, then 150 until 4.0 s, then 600.',
    harness: { signature: 'a function called isDark that takes a whole number and returns a bool', tests: [
      { id: 'd1', cpp: 'isDark(100) == true', got: 'isDark(100)' },
      { id: 'd2', cpp: 'isDark(299) == true', got: 'isDark(299)' },
      { id: 'd3', cpp: 'isDark(300) == false', got: 'isDark(300)' },
      { id: 'd4', cpp: 'isDark(900) == false', got: 'isDark(900)' }
    ]},
    tasks: [
      { text: 'Write a function <strong>isDark</strong> that takes a light reading and returns true when it\'s below 300', tests: [{ type: 'harness', id: 'd1', msg: 'isDark(100) should be true.' }, { type: 'harness', id: 'd2', msg: 'isDark(299) should be true.' }, { type: 'harness', id: 'd3', msg: 'isDark(300) should be false.' }, { type: 'harness', id: 'd4', msg: 'isDark(900) should be false.' }] },
      { text: 'Rebuild the night light with it: the built-in LED is on whenever A0 is dark', tests: [{ type: 'code', pattern: 'isDark\\s*\\(\\s*analogRead|isDark\\s*\\(\\s*\\w+\\s*\\)\\s*\\)', msg: 'Use isDark in an if inside loop.' }, { type: 'pinMode', pin: 13, mode: 1 }, statesAt([[1000, { 13: 0 }], [2500, { 13: 1 }], [4500, { 13: 0 }]], { 13: 'the LED' })] }
    ],
    starter: STARTER,
    hint: 'isDark only needs one line: return the comparison. In loop, read A0 and pass the reading to isDark inside the if.',
    solution: SK('  pinMode(LED_BUILTIN, OUTPUT);', '  if (isDark(analogRead(A0))) {\n    digitalWrite(LED_BUILTIN, HIGH);\n  } else {\n    digitalWrite(LED_BUILTIN, LOW);\n  }\n  delay(100);') + '\nbool isDark(int reading) {\n  return reading < 300;\n}\n'
  },
  {
    id: 'u7-5', title: 'Project: light meter',
    learn: `
<p>Combine a returning function with <code>map</code> to turn raw readings into something people understand.</p>
<p>A sensor reading of 0–1023 should become a percentage of 0–100.</p>`,
    scenario: { limit: 1600, analog: [[0, 0, 700], [0, 1000, 1023]] },
    inputs: 'A light sensor on A0 reads 700 until 1.0 s, then 1023.',
    harness: { signature: 'a function called toPercent that takes a whole number and returns a whole number', tests: [
      { id: 'p0', cpp: 'toPercent(0) == 0', got: 'toPercent(0)' },
      { id: 'p1', cpp: 'toPercent(1023) == 100', got: 'toPercent(1023)' },
      { id: 'p2', cpp: 'toPercent(512) == 50', got: 'toPercent(512)' }
    ]},
    tasks: [
      { text: 'Write a function <strong>toPercent</strong> that turns a reading from 0–1023 into a whole-number percentage 0–100', tests: [{ type: 'harness', id: 'p0', msg: 'toPercent(0) should be 0.' }, { type: 'harness', id: 'p1', msg: 'toPercent(1023) should be 100.' }, { type: 'harness', id: 'p2', msg: 'toPercent(512) should be 50.' }] },
      { text: 'Every 500 ms, print the A0 light level like <code>Light: 68%</code>', tests: [{ type: 'began' }, { type: 'serial', expected: 'Light: 68%\nLight: 68%\nLight: 100%\nLight: 100%' }] }
    ],
    starter: STARTER,
    hint: 'toPercent can return a single map call. In loop, print the label, the percentage of the A0 reading, and the % sign, then wait.',
    solution: SK('  Serial.begin(9600);', '  Serial.print("Light: ");\n  Serial.print(toPercent(analogRead(A0)));\n  Serial.println("%");\n  delay(500);') + '\nint toPercent(int reading) {\n  return map(reading, 0, 1023, 0, 100);\n}\n'
  }
]},

// ───────────────────────── UNIT 8 ─────────────────────────
{ id: 'u8', title: 'Arrays', exercises: [
  {
    id: 'u8-1', title: 'An array of pins',
    learn: `
<p>An <strong>array</strong> stores several values of the same type in one variable:</p>
<pre><code>int motorPins[] = {5, 6, 10, 11};</code></pre>
<ul>
<li>Get an item by its <strong>index</strong> in square brackets. Indexes start at <strong>0</strong>: <code>motorPins[0]</code> is 5.</li>
<li>This array has 4 items, so the last index is 3.</li>
<li>Arrays and for loops go together: let the loop counter be the index.</li>
</ul>
<pre><code>for (int i = 0; i &lt; 4; i++) {
  pinMode(motorPins[i], OUTPUT);
}</code></pre>`,
    scenario: { limit: 1000 },
    tasks: [
      { text: 'At the top of the sketch, create a whole-number array <strong>ledPins</strong> holding 2, 3, 4 and 5', tests: [{ type: 'code', pattern: 'int\\s+ledPins\\s*\\[\\s*\\d*\\s*\\]\\s*=\\s*\\{\\s*2\\s*,\\s*3\\s*,\\s*4\\s*,\\s*5\\s*\\}', msg: 'Create an int array named ledPins holding 2, 3, 4 and 5.' }] },
      { text: 'In setup, use a for loop over the array to set every pin as an output and turn it on', tests: [{ type: 'code', pattern: 'ledPins\\s*\\[\\s*\\w+\\s*\\]', msg: 'Use the array with an index inside the loop.' }, { type: 'notCode', pattern: 'pinMode\\s*\\(\\s*\\d', msg: 'Let the loop and the array supply the pin numbers.' },
        { type: 'pinMode', pin: 2, mode: 1 }, { type: 'pinMode', pin: 3, mode: 1 }, { type: 'pinMode', pin: 4, mode: 1 }, { type: 'pinMode', pin: 5, mode: 1 },
        statesAt([[500, { 2: 1, 3: 1, 4: 1, 5: 1 }]])] }
    ],
    starter: STARTER,
    hint: 'One for loop running 4 times. Inside it, set the mode of the pin at the current index, then switch that pin on.',
    solution: 'int ledPins[] = {2, 3, 4, 5};\n\n' + SK('  for (int i = 0; i < 4; i++) {\n    pinMode(ledPins[i], OUTPUT);\n    digitalWrite(ledPins[i], HIGH);\n  }', '')
  },
  {
    id: 'u8-2', title: 'LED chaser',
    learn: `
<p>Walk through an array to make a moving light, like a scanner or a progress bar.</p>
<p>LEDs on pins 2, 3, 4 and 5 should light up one at a time, in order, each for 150 ms, then start again from pin 2.</p>`,
    scenario: { limit: 1400 },
    tasks: [
      { text: 'Store the four pins in an array and set them all as outputs in setup', tests: [{ type: 'code', pattern: '\\[\\s*\\d*\\s*\\]\\s*=\\s*\\{', msg: 'Store the pins in an array.' }, { type: 'pinMode', pin: 2, mode: 1 }, { type: 'pinMode', pin: 5, mode: 1 }] },
      { text: 'In loop, light each LED alone for 150 ms, in order, using a for loop over the array', tests: [{ type: 'code', pattern: '\\bfor\\s*\\(', msg: 'Use a for loop to walk through the array.' }, statesAt([
        [75, { 2: 1, 3: 0, 4: 0, 5: 0 }], [225, { 2: 0, 3: 1, 4: 0, 5: 0 }], [375, { 3: 0, 4: 1, 5: 0 }], [525, { 4: 0, 5: 1, 2: 0 }], [675, { 2: 1, 5: 0 }], [1125, { 5: 1, 4: 0 }]
      ])] }
    ],
    starter: STARTER,
    hint: 'Inside the for loop: switch the current pin on, wait, switch it off. The loop moves on to the next pin automatically.',
    solution: 'int pins[] = {2, 3, 4, 5};\n\n' + SK('  for (int i = 0; i < 4; i++) {\n    pinMode(pins[i], OUTPUT);\n  }', '  for (int i = 0; i < 4; i++) {\n    digitalWrite(pins[i], HIGH);\n    delay(150);\n    digitalWrite(pins[i], LOW);\n  }')
  },
  {
    id: 'u8-3', title: 'Averaging readings',
    learn: `
<p>Sensors are noisy, so robots often average several readings. Arrays can be passed to functions, but in C++ the function can't tell how long the array is, so you pass the count too:</p>
<pre><code>int total(int values[], int count) {
  int sum = 0;
  for (int i = 0; i &lt; count; i++) {
    sum += values[i];
  }
  return sum;
}</code></pre>`,
    harness: { signature: 'a function called average that takes an int array and a count, and returns a float', tests: [
      { id: 'a1', pre: 'int a[] = {10, 20, 30};', cpp: 'academy_near(average(a, 3), 20)', got: 'average(a, 3)' },
      { id: 'a2', pre: 'int a[] = {1, 2};', cpp: 'academy_near(average(a, 2), 1.5)', got: 'average(a, 2)' },
      { id: 'a3', pre: 'int a[] = {7};', cpp: 'academy_near(average(a, 1), 7)', got: 'average(a, 1)' }
    ]},
    tasks: [
      { text: 'Write a function <strong>average</strong> that takes a whole-number array and its count, and returns the average as a decimal', tests: [{ type: 'harness', id: 'a1', msg: 'The average of 10, 20, 30 should be 20.' }, { type: 'harness', id: 'a2', msg: 'The average of 1 and 2 should be 1.5, so avoid whole-number division.' }, { type: 'harness', id: 'a3', msg: 'The average of just 7 should be 7.' }] },
      { text: 'In setup, print the average of the readings 512, 498, 530, 505 and 515', tests: [{ type: 'serial', expected: '512.00' }] }
    ],
    starter: STARTER,
    hint: 'Add everything up like the lesson example, then divide by the count, making sure one side is a float before dividing.',
    solution: SK('  Serial.begin(9600);\n  int readings[] = {512, 498, 530, 505, 515};\n  Serial.println(average(readings, 5));', '') + '\nfloat average(int values[], int count) {\n  long sum = 0;\n  for (int i = 0; i < count; i++) {\n    sum += values[i];\n  }\n  return (float) sum / count;\n}\n'
  },
  {
    id: 'u8-4', title: 'Finding the biggest',
    learn: `
<p>To find the largest item, start your "best so far" as the <strong>first item</strong>, then walk through the array and replace it whenever you find something bigger.</p>
<p>Don't start at 0: if every value is negative, 0 would wrongly win.</p>`,
    harness: { signature: 'a function called findMax that takes an int array and a count, and returns an int', tests: [
      { id: 'm1', pre: 'int a[] = {3, 9, 2};', cpp: 'findMax(a, 3) == 9', got: 'findMax(a, 3)' },
      { id: 'm2', pre: 'int a[] = {-8, -3, -12};', cpp: 'findMax(a, 3) == -3', got: 'findMax(a, 3)' },
      { id: 'm3', pre: 'int a[] = {5};', cpp: 'findMax(a, 1) == 5', got: 'findMax(a, 1)' },
      { id: 'm4', pre: 'int a[] = {1, 2, 3, 100};', cpp: 'findMax(a, 4) == 100', got: 'findMax(a, 4)' }
    ]},
    tasks: [
      { text: 'Write a function <strong>findMax</strong> that takes a whole-number array and its count, and returns the largest item', tests: [{ type: 'harness', id: 'm1', msg: 'For 3, 9, 2 it should return 9.' }, { type: 'harness', id: 'm2', msg: 'For -8, -3, -12 it should return -3.' }, { type: 'harness', id: 'm3', msg: 'For just 5 it should return 5.' }, { type: 'harness', id: 'm4', msg: 'For 1, 2, 3, 100 it should return 100.' }] },
      { text: 'In setup, print the largest of the distances 45, 120, 87 and 33', tests: [{ type: 'serial', expected: '120' }] }
    ],
    starter: STARTER,
    hint: 'Best-so-far starts as the item at index 0. Loop through the rest and replace it when an item is bigger. Return it at the end.',
    solution: SK('  Serial.begin(9600);\n  int distances[] = {45, 120, 87, 33};\n  Serial.println(findMax(distances, 4));', '') + '\nint findMax(int values[], int count) {\n  int best = values[0];\n  for (int i = 1; i < count; i++) {\n    if (values[i] > best) {\n      best = values[i];\n    }\n  }\n  return best;\n}\n'
  }
]},

// ───────────────────────── UNIT 9 ─────────────────────────
{ id: 'u9', title: 'Timing without delay', exercises: [
  {
    id: 'u9-1', title: 'millis()',
    learn: `
<p><code>millis()</code> gives the number of milliseconds since the board started. It keeps counting no matter what your code is doing.</p>
<p>It gets big quickly, so store it in an <code>unsigned long</code> (an <code>int</code> overflows after about 32 seconds on an Uno):</p>
<pre><code>unsigned long now = millis();
Serial.print("Uptime (ms): ");
Serial.println(now);</code></pre>`,
    scenario: { limit: 4500 },
    tasks: [
      { text: 'Every second, print how many whole seconds the board has been running, using millis', tests: [{ type: 'code', pattern: 'millis\\s*\\(\\s*\\)', msg: 'Use millis() to get the time.' }, { type: 'serial', expected: '0\n1\n2\n3\n4' }] }
    ],
    starter: STARTER,
    hint: 'Milliseconds divided by 1000 gives whole seconds. Print that, then pause one second.',
    solution: SK('  Serial.begin(9600);', '  Serial.println(millis() / 1000);\n  delay(1000);')
  },
  {
    id: 'u9-2', title: 'Blink without delay',
    learn: `
<p><code>delay</code> freezes the whole board: while it waits, it can't read sensors or buttons. Real robots avoid it by checking the clock instead:</p>
<pre><code>unsigned long lastBeep = 0;

void loop() {
  if (millis() - lastBeep &gt;= 2000) {
    lastBeep = millis();
    Serial.println("beep");   // runs every 2 s
  }
  // other code here keeps running
}</code></pre>
<p>"Has enough time passed since last time?" is the key question.</p>`,
    scenario: { limit: 5000 },
    tasks: [
      { text: 'Blink the built-in LED (500 ms on, 500 ms off) <strong>without using delay</strong>', tests: [{ type: 'notCode', pattern: '\\bdelay\\s*\\(', msg: 'Don\'t use delay at all in this one. Use millis to decide when to switch.' }, { type: 'code', pattern: 'millis\\s*\\(\\s*\\)', msg: 'Use millis to check how much time has passed.' }, { type: 'pinMode', pin: 13, mode: 1 }, { type: 'blink', pin: 13, on: 500, off: 500, tol: 2 }] }
    ],
    starter: STARTER,
    hint: 'Keep two variables at the top: when you last switched, and whether the LED is currently on. When 500 ms have passed, flip the state, write it to the LED, and remember the time.',
    solution: 'unsigned long lastSwitch = 0;\nbool ledOn = false;\n\n' + SK('  pinMode(LED_BUILTIN, OUTPUT);', '  if (millis() - lastSwitch >= 500) {\n    lastSwitch = millis();\n    ledOn = !ledOn;\n    digitalWrite(LED_BUILTIN, ledOn ? HIGH : LOW);\n  }')
  },
  {
    id: 'u9-3', title: 'Two things at once',
    learn: `
<p>This is why <code>millis</code> matters: with <code>delay</code> you can only wait for one thing at a time. With <code>millis</code>, each task keeps its own "last time" and they run side by side.</p>`,
    scenario: { limit: 3000 },
    tasks: [
      { text: 'Without delay, blink the built-in LED every 500 ms (on 500, off 500)', tests: [{ type: 'notCode', pattern: '\\bdelay\\s*\\(', msg: 'Don\'t use delay.' }, { type: 'pinMode', pin: 13, mode: 1 }, { type: 'blink', pin: 13, on: 500, off: 500, tol: 2 }] },
      { text: 'At the same time, blink an LED on pin 9 every 300 ms (on 300, off 300)', tests: [{ type: 'pinMode', pin: 9, mode: 1 }, { type: 'blink', pin: 9, on: 300, off: 300, tol: 2 }] }
    ],
    starter: STARTER,
    hint: 'Copy the pattern from the last exercise twice, with separate variables for each LED.',
    solution: 'unsigned long lastA = 0, lastB = 0;\nbool aOn = false, bOn = false;\n\n' + SK('  pinMode(LED_BUILTIN, OUTPUT);\n  pinMode(9, OUTPUT);', '  unsigned long now = millis();\n  if (now - lastA >= 500) {\n    lastA = now;\n    aOn = !aOn;\n    digitalWrite(LED_BUILTIN, aOn ? HIGH : LOW);\n  }\n  if (now - lastB >= 300) {\n    lastB = now;\n    bOn = !bOn;\n    digitalWrite(9, bOn ? HIGH : LOW);\n  }')
  },
  {
    id: 'u9-4', title: 'Project: toggle switch',
    learn: `
<p>A push button that toggles: press once for on, press again for off. You need to catch the <strong>moment</strong> the button goes down (its state <em>changes</em> from not-pressed to pressed), not just whether it's pressed right now. Otherwise holding the button would flip the LED thousands of times.</p>
<pre><code>int lastReading = HIGH;

void loop() {
  int reading = digitalRead(7);
  if (reading == LOW &amp;&amp; lastReading == HIGH) {
    // this runs once per press
  }
  lastReading = reading;
}</code></pre>
<p>Real buttons "bounce" for a few milliseconds, so add a short <code>delay(10)</code> or a millis check.</p>`,
    scenario: { limit: 4000, digital: [[2, 1000, 0], [2, 1200, 1], [2, 2000, 0], [2, 2200, 1], [2, 3000, 0], [2, 3200, 1]] },
    inputs: 'A pull-up button on pin 2 is pressed three times: at 1.0 s, 2.0 s and 3.0 s (each press lasts 0.2 s).',
    tasks: [
      { text: 'Set pin 2 as a pull-up input and the built-in LED as an output', tests: [{ type: 'pinMode', pin: 2, mode: 2 }, { type: 'pinMode', pin: 13, mode: 1 }] },
      { text: 'Each press flips the LED: on after the first press, off after the second, on after the third', tests: [statesAt([[500, { 13: 0 }], [1100, { 13: 1 }], [1500, { 13: 1 }], [2500, { 13: 0 }], [3500, { 13: 1 }]], { 13: 'the LED' })] }
    ],
    starter: STARTER,
    hint: 'Keep the last reading and whether the LED is on in variables at the top. When you see the change from not-pressed to pressed, flip the LED state and write it.',
    solution: 'int lastReading = HIGH;\nbool ledOn = false;\n\n' + SK('  pinMode(2, INPUT_PULLUP);\n  pinMode(LED_BUILTIN, OUTPUT);', '  int reading = digitalRead(2);\n  if (reading == LOW && lastReading == HIGH) {\n    ledOn = !ledOn;\n    digitalWrite(LED_BUILTIN, ledOn ? HIGH : LOW);\n  }\n  lastReading = reading;\n  delay(10);')
  }
]},

// ───────────────────────── UNIT 10 ─────────────────────────
{ id: 'u10', title: 'Motors and servos', exercises: [
  {
    id: 'u10-1', title: 'Servo positions',
    learn: `
<p>A <strong>servo</strong> moves to an angle from 0° to 180° and holds it. It's used for arms, grippers and steering. Servos need the Servo library:</p>
<pre><code>#include &lt;Servo.h&gt;

Servo arm;            // create a servo object

void setup() {
  arm.attach(6);      // signal wire on pin 6
  arm.write(45);      // move to 45°
}</code></pre>
<p>A servo takes time to move, so wait after each <code>write</code>.</p>`,
    scenario: { limit: 3500 },
    tasks: [
      { text: 'Include the Servo library and create a servo attached to pin 9', tests: [{ type: 'code', pattern: '#include\\s*[<"]Servo\\.h[>"]', msg: 'Include the Servo library at the top.' }, { type: 'code', pattern: '\\.attach\\s*\\(\\s*9\\s*\\)', msg: 'Attach your servo to pin 9.' }] },
      { text: 'In setup, move it to 0°, wait 1 s, then 90°, wait 1 s, then 180°', tests: [servoAt(9, [[500, 0], [1500, 90], [2500, 180]])] }
    ],
    starter: STARTER,
    hint: 'The include and the Servo object go at the top. In setup: attach, then three moves with one-second waits between them.',
    solution: '#include <Servo.h>\n\nServo myServo;\n\n' + SK('  myServo.attach(9);\n  myServo.write(0);\n  delay(1000);\n  myServo.write(90);\n  delay(1000);\n  myServo.write(180);', '')
  },
  {
    id: 'u10-2', title: 'Servo follows a knob',
    learn: `
<p>Connect input to output: read a potentiometer (a knob) on an analog pin and point a servo to match. The reading goes 0–1023 but the servo wants 0–180, which is exactly what <code>map</code> is for.</p>`,
    scenario: { limit: 3000, analog: [[0, 0, 0], [0, 1000, 1023], [0, 2000, 512]] },
    inputs: 'A knob on A0 is turned fully left (0) until 1.0 s, fully right (1023) until 2.0 s, then to the middle (512).',
    tasks: [
      { text: 'Attach a servo to pin 9', tests: [{ type: 'code', pattern: '\\.attach\\s*\\(\\s*9\\s*\\)', msg: 'Attach your servo to pin 9.' }] },
      { text: 'In loop, read A0, convert it to an angle with map, move the servo there, and wait 20 ms', tests: [{ type: 'code', pattern: '\\bmap\\s*\\(', msg: 'Use map to convert the reading to an angle.' }, servoAt(9, [[500, 0], [1500, 180], [2500, 90]])] }
    ],
    starter: STARTER,
    hint: 'Three steps in loop: read, map from the sensor range to the servo range, write. Then a short pause.',
    solution: '#include <Servo.h>\n\nServo myServo;\n\n' + SK('  myServo.attach(9);', '  int reading = analogRead(A0);\n  int angle = map(reading, 0, 1023, 0, 180);\n  myServo.write(angle);\n  delay(20);')
  },
  {
    id: 'u10-3', title: 'Project: drive a DC motor',
    learn: `
<p>DC motors need more current than a pin can give, so they connect through a <strong>motor driver</strong> (H-bridge). A typical driver uses three pins:</p>
<ul>
<li><strong>Speed</strong>: a PWM pin, <code>analogWrite</code> 0–255</li>
<li><strong>Direction A</strong> and <strong>Direction B</strong>: one HIGH and one LOW picks the direction; swap them to reverse</li>
</ul>
<pre><code>// spin one way at half speed
digitalWrite(IN1, HIGH);
digitalWrite(IN2, LOW);
analogWrite(EN, 128);</code></pre>
<p>Wiring for this project: speed on pin 5, direction A on pin 7, direction B on pin 8.</p>`,
    scenario: { limit: 6000 },
    tasks: [
      { text: 'Set pins 5, 7 and 8 as outputs', tests: [{ type: 'pinMode', pin: 5, mode: 1 }, { type: 'pinMode', pin: 7, mode: 1 }, { type: 'pinMode', pin: 8, mode: 1 }] },
      { text: 'In setup, drive forward (A high, B low) at speed 200 for 2 s, then stop (speed 0) for 1 s', tests: [statesAt([[1000, { 7: 1, 8: 0, 5: 200 }], [2500, { 5: 0 }]], { 5: 'the speed pin', 7: 'direction A', 8: 'direction B' })] },
      { text: 'Then reverse (A low, B high) at speed 150 for 2 s, then stop', tests: [statesAt([[4000, { 7: 0, 8: 1, 5: 150 }], [5500, { 5: 0 }]], { 5: 'the speed pin', 7: 'direction A', 8: 'direction B' })] }
    ],
    starter: STARTER,
    hint: 'Give the three pins constant names. Each phase sets the two direction pins, sets the speed, then waits. Stopping only needs the speed set to 0.',
    solution: 'const int EN = 5;\nconst int IN1 = 7;\nconst int IN2 = 8;\n\n' + SK('  pinMode(EN, OUTPUT);\n  pinMode(IN1, OUTPUT);\n  pinMode(IN2, OUTPUT);\n\n  digitalWrite(IN1, HIGH);\n  digitalWrite(IN2, LOW);\n  analogWrite(EN, 200);\n  delay(2000);\n  analogWrite(EN, 0);\n  delay(1000);\n\n  digitalWrite(IN1, LOW);\n  digitalWrite(IN2, HIGH);\n  analogWrite(EN, 150);\n  delay(2000);\n  analogWrite(EN, 0);', '')
  }
]}
];
