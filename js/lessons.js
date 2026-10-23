// Curriculum. Each exercise: learn (HTML), tasks (checklist + tests), starter, hint, solution, optional harness.
// Code runs on Java 8 (the in-browser compiler), so avoid var, records, text blocks, String.repeat, etc.
(function (root) {
  const S = (body) => 'public class Main {\n    public static void main(String[] args) {\n' + body + '\n    }\n}\n';
  const W = '        // Write your code below\n        ';

  const CURRICULUM = [
  // ───────────────────────── UNIT 1 ─────────────────────────
  { id: 'u1', title: 'Hello, Java', exercises: [
    {
      id: 'u1-1', title: 'Your first program',
      learn: `
<p>A Java program is a set of instructions the computer runs from top to bottom. Every program needs some required wrapping, and for now you can treat it as boilerplate:</p>
<pre><code>public class Main {
    public static void main(String[] args) {
        // your instructions go here
    }
}</code></pre>
<ul>
<li><code>public class Main</code> is a container for your code. The file is called <code>Main.java</code>, so the class must be called <code>Main</code>.</li>
<li><code>public static void main(String[] args)</code> is where the program <strong>starts</strong>. Java runs whatever is inside its curly braces.</li>
</ul>
<p>To print text to the screen, use:</p>
<pre><code>System.out.println("Hi there");</code></pre>
<p>A few rules to remember:</p>
<ul>
<li>Text goes inside double quotes. Text like this is called a <em>String</em>.</li>
<li>Every instruction ends with a semicolon <code>;</code>.</li>
<li>Capitals matter. <code>System</code> works, but <code>system</code> does not.</li>
</ul>`,
      tasks: [
        { text: 'Print exactly <code>Hello, world</code>', tests: [{ type: 'output', expected: 'Hello, world' }] }
      ],
      starter: S(W),
      hint: 'Inside main, write <code>System.out.println("Hello, world");</code>. Check the capital S, the quotes and the semicolon.',
      solution: S('        System.out.println("Hello, world");')
    },
    {
      id: 'u1-2', title: 'More lines',
      learn: `
<p>Each <code>System.out.println(...)</code> prints its text and then moves to a <strong>new line</strong>. So three println statements give three lines of output:</p>
<pre><code>System.out.println("Line one");
System.out.println("Line two");
System.out.println("Line three");</code></pre>
<p>Statements run in order, from top to bottom.</p>`,
      tasks: [
        { text: 'On the first line, print <code>My name is</code> followed by your name', tests: [{ type: 'outputRegex', pattern: '^My name is \\S', flags: '', msg: 'The first line should start with "My name is " and then your name.' }] },
        { text: 'On the second line, print <code>I am learning Java</code>', tests: [{ type: 'outputRegex', pattern: '^[^\\n]*\\nI am learning Java$', flags: '', msg: 'The second line should be exactly "I am learning Java", and it should be the last line.' }] }
      ],
      starter: S(W),
      hint: 'You need two separate <code>System.out.println(...);</code> statements, one per line.',
      solution: S('        System.out.println("My name is Max");\n        System.out.println("I am learning Java");')
    },
    {
      id: 'u1-3', title: 'print vs println',
      learn: `
<p><code>println</code> moves to a new line after printing. <code>print</code> (without "ln") does <strong>not</strong>, so the next output continues on the same line.</p>
<pre><code>System.out.print("Ja");
System.out.print("va");
System.out.println("!");</code></pre>
<p>This prints <code>Java!</code> on one line. Spaces only appear if you put them inside the quotes yourself.</p>`,
      tasks: [
        { text: 'Use <code>System.out.print</code> three times to print <code>3 </code>, <code>2 </code> and <code>1 </code>', tests: [{ type: 'codeCount', pattern: 'System\\.out\\.print\\s*\\(', min: 3, msg: 'Use System.out.print( at least three times.' }] },
        { text: 'Finish with <code>System.out.println("Liftoff!");</code> so the output is <code>3 2 1 Liftoff!</code>', tests: [{ type: 'output', expected: '3 2 1 Liftoff!' }] }
      ],
      starter: S(W),
      hint: 'Put a space inside each quote: <code>System.out.print("3 ");</code>',
      solution: S('        System.out.print("3 ");\n        System.out.print("2 ");\n        System.out.print("1 ");\n        System.out.println("Liftoff!");')
    },
    {
      id: 'u1-4', title: 'Bug hunt',
      learn: `
<p>When code breaks the rules, the <strong>compiler</strong> refuses to run it and gives you an error message. Errors are normal, and reading them is a core skill.</p>
<p>Each error tells you the <strong>line number</strong> and what went wrong. Below the console, this site also explains each error in plain English.</p>
<p>You'll also see <strong>comments</strong>. Java ignores them completely. They're notes for humans:</p>
<pre><code>// This is a single-line comment
/* This is a
   multi-line comment */</code></pre>`,
      tasks: [
        { text: 'Fix the three bugs so the program compiles', tests: [{ type: 'outputLines', count: 3, msg: 'Get the program compiling and printing all three lines.' }] },
        { text: 'Output should be the three lines exactly as written', tests: [{ type: 'output', expected: 'Bugs are normal\nEvery programmer makes them\nRead the error message' }] }
      ],
      starter: 'public class Main {\n    public static void main(String[] args) {\n        // There are 3 bugs in this program. Run it and read the errors.\n        System.out.println("Bugs are normal")\n        system.out.println("Every programmer makes them");\n        System.out.println("Read the error message);\n    }\n}\n',
      hint: 'Line 4 is missing a semicolon. Line 5 needs a capital S in System. Line 6 is missing a closing quote.',
      solution: S('        System.out.println("Bugs are normal");\n        System.out.println("Every programmer makes them");\n        System.out.println("Read the error message");')
    }
  ]},

  // ───────────────────────── UNIT 2 ─────────────────────────
  { id: 'u2', title: 'Variables', exercises: [
    {
      id: 'u2-1', title: 'Storing a number',
      learn: `
<p>A <strong>variable</strong> is a named box that stores a value. In Java you must say what <em>type</em> of value goes in the box.</p>
<pre><code>int apples = 12;</code></pre>
<ul>
<li><code>int</code> is the type (a whole number)</li>
<li><code>apples</code> is the name</li>
<li><code>= 12</code> puts 12 in the box</li>
</ul>
<p>To print a variable's value, use its name <strong>without quotes</strong>:</p>
<pre><code>System.out.println(apples);   // prints 12
System.out.println("apples"); // prints the word apples</code></pre>`,
      tasks: [
        { text: 'Create an <code>int</code> variable called <code>apples</code> set to <code>12</code>', tests: [{ type: 'code', pattern: '\\bint\\s+apples\\s*=\\s*12\\s*;', msg: 'Declare it like this: int apples = 12;' }] },
        { text: 'Print the variable (not the number typed directly)', tests: [{ type: 'code', pattern: 'println\\s*\\(\\s*apples\\s*\\)', msg: 'Print it with System.out.println(apples);' }, { type: 'output', expected: '12' }] }
      ],
      starter: S(W),
      hint: 'Two lines: <code>int apples = 12;</code> then <code>System.out.println(apples);</code>',
      solution: S('        int apples = 12;\n        System.out.println(apples);')
    },
    {
      id: 'u2-2', title: 'Types',
      learn: `
<p>The most common types:</p>
<table>
<tr><th>Type</th><th>Holds</th><th>Example</th></tr>
<tr><td><code>int</code></td><td>whole numbers</td><td><code>int lives = 3;</code></td></tr>
<tr><td><code>double</code></td><td>decimal numbers</td><td><code>double speed = 2.5;</code></td></tr>
<tr><td><code>boolean</code></td><td><code>true</code> or <code>false</code></td><td><code>boolean done = false;</code></td></tr>
<tr><td><code>char</code></td><td>one character, in single quotes</td><td><code>char grade = 'B';</code></td></tr>
<tr><td><code>String</code></td><td>text, in double quotes</td><td><code>String city = "Oakville";</code></td></tr>
</table>
<p><code>String</code> has a capital S because it's a class rather than a basic type. More on that later.</p>`,
      tasks: [
        { text: 'Create <code>double price = 4.99;</code>', tests: [{ type: 'code', pattern: '\\bdouble\\s+price\\s*=\\s*4\\.99\\s*;', msg: 'Missing: double price = 4.99;' }] },
        { text: 'Create <code>boolean inStock = true;</code>', tests: [{ type: 'code', pattern: '\\bboolean\\s+inStock\\s*=\\s*true\\s*;', msg: 'Missing: boolean inStock = true;' }] },
        { text: "Create <code>char grade = 'A';</code>", tests: [{ type: 'code', pattern: "\\bchar\\s+grade\\s*=\\s*'A'\\s*;", msg: "Missing: char grade = 'A';  (single quotes for char)" }] },
        { text: 'Create <code>String name = "Java";</code>', tests: [{ type: 'code', pattern: '\\bString\\s+name\\s*=\\s*"Java"\\s*;', msg: 'Missing: String name = "Java";' }] },
        { text: 'Print all four variables, each on its own line, in that order', tests: [{ type: 'output', expected: '4.99\ntrue\nA\nJava' }] }
      ],
      starter: S(W),
      hint: 'Declare the four variables, then use four <code>System.out.println(...)</code> statements with the variable names (no quotes).',
      solution: S('        double price = 4.99;\n        boolean inStock = true;\n        char grade = \'A\';\n        String name = "Java";\n        System.out.println(price);\n        System.out.println(inStock);\n        System.out.println(grade);\n        System.out.println(name);')
    },
    {
      id: 'u2-3', title: 'Changing values',
      learn: `
<p>Once a variable exists, you can give it a new value. Don't repeat the type, because that would try to create a second variable with the same name:</p>
<pre><code>int score = 10;
score = 20;          // now 20
score = score + 5;   // now 25</code></pre>
<p>Shortcuts:</p>
<pre><code>score += 5;   // same as score = score + 5
score -= 3;   // same as score = score - 3
score++;      // add 1
score--;      // subtract 1</code></pre>`,
      tasks: [
        { text: 'Start with <code>int coins = 10;</code>', tests: [{ type: 'code', pattern: '\\bint\\s+coins\\s*=\\s*10\\s*;', msg: 'Start with: int coins = 10;' }] },
        { text: 'Add 5 using <code>+=</code>', tests: [{ type: 'code', pattern: 'coins\\s*\\+=\\s*5\\s*;', msg: 'Use coins += 5;' }] },
        { text: 'Subtract 3 using <code>-=</code>', tests: [{ type: 'code', pattern: 'coins\\s*-=\\s*3\\s*;', msg: 'Use coins -= 3;' }] },
        { text: 'Add 1 using <code>++</code>, then print <code>coins</code>', tests: [{ type: 'code', pattern: 'coins\\s*\\+\\+|\\+\\+\\s*coins', msg: 'Use coins++;' }, { type: 'output', expected: '13' }] }
      ],
      starter: S(W),
      hint: '10 + 5 − 3 + 1 = 13. Write each step on its own line, then <code>System.out.println(coins);</code>',
      solution: S('        int coins = 10;\n        coins += 5;\n        coins -= 3;\n        coins++;\n        System.out.println(coins);')
    },
    {
      id: 'u2-4', title: 'Joining text',
      learn: `
<p>The <code>+</code> sign joins Strings together. This is called <strong>concatenation</strong>. It also works with numbers and other values:</p>
<pre><code>String name = "Sam";
int age = 16;
System.out.println(name + " is " + age + " years old");
// Sam is 16 years old</code></pre>
<p>Watch the spaces. Java only adds the ones that are inside your quotes.</p>`,
      tasks: [
        { text: 'Create <code>String city = "Toronto";</code> and <code>int temp = 21;</code>', tests: [{ type: 'code', pattern: '\\bString\\s+city\\s*=\\s*"Toronto"\\s*;', msg: 'Missing: String city = "Toronto";' }, { type: 'code', pattern: '\\bint\\s+temp\\s*=\\s*21\\s*;', msg: 'Missing: int temp = 21;' }] },
        { text: 'Using the variables, print <code>It is 21 degrees in Toronto</code>', tests: [{ type: 'code', pattern: '\\+\\s*temp\\b|\\btemp\\s*\\+', msg: 'Join the temp variable into the String with +.' }, { type: 'code', pattern: '\\+\\s*city\\b|\\bcity\\s*\\+', msg: 'Join the city variable into the String with +.' }, { type: 'output', expected: 'It is 21 degrees in Toronto' }] }
      ],
      starter: S(W),
      hint: '<code>System.out.println("It is " + temp + " degrees in " + city);</code>',
      solution: S('        String city = "Toronto";\n        int temp = 21;\n        System.out.println("It is " + temp + " degrees in " + city);')
    }
  ]},

  // ───────────────────────── UNIT 3 ─────────────────────────
  { id: 'u3', title: 'Math', exercises: [
    {
      id: 'u3-1', title: 'Arithmetic',
      learn: `
<p>Java does math with <code>+ - * /</code> and <code>%</code> (remainder).</p>
<p><strong>Watch out:</strong> when both numbers are <code>int</code>, division throws away the decimal part:</p>
<pre><code>System.out.println(7 / 2);    // 3, not 3.5
System.out.println(7 % 2);    // 1  (remainder of 7 ÷ 2)
System.out.println(7 / 2.0);  // 3.5 (one side is a decimal)</code></pre>
<p><code>%</code> is very useful. For example, <code>n % 2 == 0</code> means <code>n</code> is even.</p>`,
      tasks: [
        { text: 'Print <code>7 / 2</code>', tests: [{ type: 'code', pattern: '7\\s*/\\s*2(?![\\d.])', msg: 'Print the expression 7 / 2 (let Java calculate it).' }] },
        { text: 'Print <code>7 % 2</code>', tests: [{ type: 'code', pattern: '7\\s*%\\s*2', msg: 'Print the expression 7 % 2.' }] },
        { text: 'Print <code>7 / 2.0</code>', tests: [{ type: 'code', pattern: '7\\s*/\\s*2\\.0', msg: 'Print the expression 7 / 2.0.' }, { type: 'output', expected: '3\n1\n3.5' }] }
      ],
      starter: S(W),
      hint: 'Three lines like <code>System.out.println(7 / 2);</code>, with no quotes, so Java does the math.',
      solution: S('        System.out.println(7 / 2);\n        System.out.println(7 % 2);\n        System.out.println(7 / 2.0);')
    },
    {
      id: 'u3-2', title: 'Casting',
      learn: `
<p>If you have two <code>int</code> variables and want a decimal answer, <strong>cast</strong> one of them to <code>double</code> first:</p>
<pre><code>int total = 10;
int count = 4;
System.out.println(total / count);           // 2
System.out.println((double) total / count);  // 2.5</code></pre>
<p><code>(double)</code> converts the value right after it. You can also cast the other way: <code>(int) 9.99</code> gives <code>9</code>. It chops off the decimals and does not round.</p>`,
      tasks: [
        { text: 'Create <code>int total = 17;</code> and <code>int people = 4;</code>', tests: [{ type: 'code', pattern: '\\bint\\s+total\\s*=\\s*17\\s*;', msg: 'Missing: int total = 17;' }, { type: 'code', pattern: '\\bint\\s+people\\s*=\\s*4\\s*;', msg: 'Missing: int people = 4;' }] },
        { text: 'Print the exact average using a <code>(double)</code> cast', tests: [{ type: 'code', pattern: '\\(\\s*double\\s*\\)', msg: 'Use a (double) cast.' }, { type: 'output', expected: '4.25' }] }
      ],
      starter: S(W),
      hint: '<code>System.out.println((double) total / people);</code>',
      solution: S('        int total = 17;\n        int people = 4;\n        System.out.println((double) total / people);')
    },
    {
      id: 'u3-3', title: 'The Math class',
      learn: `
<p>Java has a built-in <code>Math</code> class with useful tools:</p>
<pre><code>Math.sqrt(25)      // 5.0   square root
Math.pow(2, 3)     // 8.0   2 to the power 3
Math.max(4, 9)     // 9     bigger of two
Math.min(4, 9)     // 4     smaller of two
Math.abs(-7)       // 7     absolute value
Math.round(2.6)    // 3     round to nearest</code></pre>
<p><code>sqrt</code> and <code>pow</code> always give back a <code>double</code>, which is why you see <code>.0</code>.</p>`,
      tasks: [
        { text: 'Use <code>Math.sqrt</code> and <code>Math.pow</code> to print the hypotenuse of a triangle with sides 3 and 4', tests: [{ type: 'code', pattern: 'Math\\.sqrt\\s*\\(', msg: 'Use Math.sqrt(...).' }, { type: 'code', pattern: 'Math\\.pow\\s*\\(', msg: 'Use Math.pow(...) to square each side.' }, { type: 'outputRegex', pattern: '^5\\.0$', flags: 'm', msg: 'The first line should be 5.0' }] },
        { text: 'On the next line, print <code>Math.max(12, 30)</code>', tests: [{ type: 'code', pattern: 'Math\\.max\\s*\\(', msg: 'Use Math.max(12, 30).' }, { type: 'output', expected: '5.0\n30' }] }
      ],
      starter: S(W),
      hint: 'Hypotenuse = √(3² + 4²): <code>Math.sqrt(Math.pow(3, 2) + Math.pow(4, 2))</code>',
      solution: S('        System.out.println(Math.sqrt(Math.pow(3, 2) + Math.pow(4, 2)));\n        System.out.println(Math.max(12, 30));')
    },
    {
      id: 'u3-4', title: 'Project: temperature converter',
      learn: `
<p>Time to combine what you know. The formula to convert Celsius to Fahrenheit is:</p>
<p class="formula">F = C × 9 / 5 + 32</p>
<p>Use <code>double</code> variables so decimals work. When you print a <code>double</code>, Java always shows at least one decimal, so 25 prints as <code>25.0</code>.</p>`,
      tasks: [
        { text: 'Create <code>double c = 25;</code>', tests: [{ type: 'code', pattern: '\\bdouble\\s+c\\s*=\\s*25(\\.0)?\\s*;', msg: 'Missing: double c = 25;' }] },
        { text: 'Create a <code>double f</code> calculated from <code>c</code> with the formula', tests: [{ type: 'code', pattern: '\\bdouble\\s+f\\s*=[^;]*\\bc\\b', msg: 'Create double f = ... using c in the formula.' }] },
        { text: 'Print <code>25.0 C = 77.0 F</code> using both variables', tests: [{ type: 'output', expected: '25.0 C = 77.0 F' }] }
      ],
      starter: S(W),
      hint: '<code>double f = c * 9 / 5 + 32;</code> then <code>System.out.println(c + " C = " + f + " F");</code>',
      solution: S('        double c = 25;\n        double f = c * 9 / 5 + 32;\n        System.out.println(c + " C = " + f + " F");')
    }
  ]},

  // ───────────────────────── UNIT 4 ─────────────────────────
  { id: 'u4', title: 'Decisions', exercises: [
    {
      id: 'u4-1', title: 'Comparisons',
      learn: `
<p>Comparisons give back a <code>boolean</code> (true or false):</p>
<table>
<tr><th>Operator</th><th>Meaning</th></tr>
<tr><td><code>==</code></td><td>equal to (two equals signs, because one <code>=</code> assigns)</td></tr>
<tr><td><code>!=</code></td><td>not equal to</td></tr>
<tr><td><code>&gt;</code> <code>&lt;</code></td><td>greater than, less than</td></tr>
<tr><td><code>&gt;=</code> <code>&lt;=</code></td><td>greater/less than or equal</td></tr>
</table>
<pre><code>System.out.println(10 &gt; 3);   // true</code></pre>`,
      tasks: [
        { text: 'Print <code>5 &gt; 3</code>', tests: [{ type: 'code', pattern: '5\\s*>\\s*3', msg: 'Print 5 > 3' }] },
        { text: 'Print <code>10 == 10</code>', tests: [{ type: 'code', pattern: '10\\s*==\\s*10', msg: 'Print 10 == 10' }] },
        { text: 'Print <code>4 != 4</code>', tests: [{ type: 'code', pattern: '4\\s*!=\\s*4', msg: 'Print 4 != 4' }] },
        { text: 'Print <code>7 &lt;= 6</code>', tests: [{ type: 'code', pattern: '7\\s*<=\\s*6', msg: 'Print 7 <= 6' }, { type: 'output', expected: 'true\ntrue\nfalse\nfalse' }] }
      ],
      starter: S(W),
      hint: 'Four lines like <code>System.out.println(5 &gt; 3);</code>',
      solution: S('        System.out.println(5 > 3);\n        System.out.println(10 == 10);\n        System.out.println(4 != 4);\n        System.out.println(7 <= 6);')
    },
    {
      id: 'u4-2', title: 'if / else',
      learn: `
<p>An <code>if</code> statement runs code only when a condition is true. <code>else</code> runs when it's false:</p>
<pre><code>int battery = 15;
if (battery &lt; 20) {
    System.out.println("Low battery");
} else {
    System.out.println("Battery OK");
}</code></pre>
<p>The condition goes in round brackets, and the code to run goes in curly braces. There's no semicolon after the <code>if (...)</code>.</p>`,
      tasks: [
        { text: 'Create <code>int temperature = 30;</code>', tests: [{ type: 'code', pattern: '\\bint\\s+temperature\\s*=\\s*30\\s*;', msg: 'Missing: int temperature = 30;' }] },
        { text: 'If <code>temperature</code> is greater than 25, print <code>Hot</code>; otherwise print <code>Not hot</code>', tests: [{ type: 'code', pattern: 'if\\s*\\(\\s*temperature\\s*>\\s*25\\s*\\)', msg: 'Use if (temperature > 25)' }, { type: 'code', pattern: '\\belse\\b', msg: 'Add an else block that prints "Not hot".' }, { type: 'code', pattern: '"Not hot"', msg: 'The else block should print "Not hot".' }, { type: 'output', expected: 'Hot' }] }
      ],
      starter: S(W),
      hint: 'Copy the battery example and change the variable, the condition and the two messages.',
      solution: S('        int temperature = 30;\n        if (temperature > 25) {\n            System.out.println("Hot");\n        } else {\n            System.out.println("Not hot");\n        }')
    },
    {
      id: 'u4-3', title: 'else if',
      learn: `
<p>Chain more checks with <code>else if</code>. Java tests each condition from top to bottom and runs <strong>only the first</strong> one that's true:</p>
<pre><code>int speed = 70;
if (speed &gt; 100) {
    System.out.println("Too fast");
} else if (speed &gt; 50) {
    System.out.println("Cruising");
} else {
    System.out.println("Slow");
}</code></pre>
<p>Because 70 isn't over 100 but is over 50, this prints <code>Cruising</code>. Order matters.</p>`,
      tasks: [
        { text: 'Create <code>int score = 85;</code>', tests: [{ type: 'code', pattern: '\\bint\\s+score\\s*=\\s*85\\s*;', msg: 'Missing: int score = 85;' }] },
        { text: 'Print the letter grade: 90+ is <code>A</code>, 80+ is <code>B</code>, 70+ is <code>C</code>, anything else is <code>F</code>', tests: [{ type: 'codeCount', pattern: 'else\\s+if', min: 2, msg: 'Use at least two else if branches (A, B, C, then else F).' }, { type: 'code', pattern: '"F"', msg: 'Your else branch should print "F".' }, { type: 'output', expected: 'B' }] }
      ],
      starter: S(W),
      hint: 'Start with <code>if (score &gt;= 90)</code>, then <code>else if (score &gt;= 80)</code>, then <code>else if (score &gt;= 70)</code>, then <code>else</code>.',
      solution: S('        int score = 85;\n        if (score >= 90) {\n            System.out.println("A");\n        } else if (score >= 80) {\n            System.out.println("B");\n        } else if (score >= 70) {\n            System.out.println("C");\n        } else {\n            System.out.println("F");\n        }')
    },
    {
      id: 'u4-4', title: 'AND, OR, NOT',
      learn: `
<p>Combine conditions:</p>
<ul>
<li><code>&amp;&amp;</code> (AND): true only if <strong>both</strong> sides are true</li>
<li><code>||</code> (OR): true if <strong>either</strong> side is true</li>
<li><code>!</code> (NOT): flips true and false</li>
</ul>
<pre><code>boolean raining = true;
boolean haveUmbrella = false;
if (raining &amp;&amp; !haveUmbrella) {
    System.out.println("You'll get wet");
}</code></pre>`,
      tasks: [
        { text: 'Create <code>int age = 17;</code> and <code>boolean hasLicence = true;</code>', tests: [{ type: 'code', pattern: '\\bint\\s+age\\s*=\\s*17\\s*;', msg: 'Missing: int age = 17;' }, { type: 'code', pattern: '\\bboolean\\s+hasLicence\\s*=\\s*true\\s*;', msg: 'Missing: boolean hasLicence = true;' }] },
        { text: 'If age is at least 16 <strong>and</strong> they have a licence, print <code>Can drive</code>, else print <code>Cannot drive</code>', tests: [{ type: 'code', pattern: '&&', msg: 'Combine both conditions with &&.' }, { type: 'code', pattern: '"Cannot drive"', msg: 'Add an else that prints "Cannot drive".' }, { type: 'output', expected: 'Can drive' }] }
      ],
      starter: S(W),
      hint: '<code>if (age &gt;= 16 &amp;&amp; hasLicence) { ... } else { ... }</code>. A boolean variable can be the condition by itself.',
      solution: S('        int age = 17;\n        boolean hasLicence = true;\n        if (age >= 16 && hasLicence) {\n            System.out.println("Can drive");\n        } else {\n            System.out.println("Cannot drive");\n        }')
    },
    {
      id: 'u4-5', title: 'Comparing Strings',
      learn: `
<p>This is a classic beginner trap: <strong>don't compare Strings with <code>==</code></strong>. It checks whether two variables point at the same object in memory, not whether the text matches. Sometimes it seems to work, which makes it worse.</p>
<p>Use <code>.equals()</code> instead:</p>
<pre><code>String answer = "yes";
if (answer.equals("yes")) {
    System.out.println("Confirmed");
}</code></pre>
<p>Use <code>.equalsIgnoreCase()</code> if capital letters shouldn't matter.</p>`,
      tasks: [
        { text: 'Create <code>String password = "java123";</code>', tests: [{ type: 'code', pattern: '\\bString\\s+password\\s*=\\s*"java123"\\s*;', msg: 'Missing: String password = "java123";' }] },
        { text: 'If it equals <code>"java123"</code>, print <code>Access granted</code>, else <code>Access denied</code>. Use <code>.equals</code>, not <code>==</code>.', tests: [{ type: 'notCode', pattern: 'password\\s*==|==\\s*password', msg: 'Don\'t use == to compare Strings. Use password.equals("java123").' }, { type: 'code', pattern: '\\.equals\\s*\\(', msg: 'Use .equals(...).' }, { type: 'code', pattern: '"Access denied"', msg: 'Add an else that prints "Access denied".' }, { type: 'output', expected: 'Access granted' }] }
      ],
      starter: S(W),
      hint: '<code>if (password.equals("java123")) { ... } else { ... }</code>',
      solution: S('        String password = "java123";\n        if (password.equals("java123")) {\n            System.out.println("Access granted");\n        } else {\n            System.out.println("Access denied");\n        }')
    }
  ]},

  // ───────────────────────── UNIT 5 ─────────────────────────
  { id: 'u5', title: 'Loops', exercises: [
    {
      id: 'u5-1', title: 'while loops',
      learn: `
<p>A <code>while</code> loop repeats its block <strong>as long as</strong> the condition stays true:</p>
<pre><code>int n = 3;
while (n &gt; 0) {
    System.out.println(n);
    n--;
}
// prints 3, 2, 1</code></pre>
<p>Always change something inside the loop that eventually makes the condition false. If you don't, the loop runs forever. If that happens, reload the page; your code is saved.</p>`,
      tasks: [
        { text: 'Use a <code>while</code> loop to print the numbers 1 to 5, each on its own line', tests: [{ type: 'code', pattern: '\\bwhile\\s*\\(', msg: 'Use a while loop.' }, { type: 'output', expected: '1\n2\n3\n4\n5' }] }
      ],
      starter: S(W),
      hint: 'Start at <code>int i = 1;</code>, loop <code>while (i &lt;= 5)</code>, print <code>i</code>, then <code>i++;</code>',
      solution: S('        int i = 1;\n        while (i <= 5) {\n            System.out.println(i);\n            i++;\n        }')
    },
    {
      id: 'u5-2', title: 'for loops',
      learn: `
<p>A <code>for</code> loop puts the counter setup, condition and update all in one line:</p>
<pre><code>for (int i = 0; i &lt; 3; i++) {
    System.out.println("Lap " + i);
}
// Lap 0, Lap 1, Lap 2</code></pre>
<p>The three parts are separated by semicolons:</p>
<ol>
<li><strong>start</strong>: <code>int i = 0</code> runs once</li>
<li><strong>condition</strong>: <code>i &lt; 3</code> is checked before each lap</li>
<li><strong>update</strong>: <code>i++</code> runs after each lap</li>
</ol>
<p>The update can be anything, for example <code>i += 2</code>.</p>`,
      tasks: [
        { text: 'Use a <code>for</code> loop to print the even numbers from 2 to 10, each on its own line', tests: [{ type: 'code', pattern: '\\bfor\\s*\\(', msg: 'Use a for loop.' }, { type: 'output', expected: '2\n4\n6\n8\n10' }] }
      ],
      starter: S(W),
      hint: '<code>for (int i = 2; i &lt;= 10; i += 2)</code>',
      solution: S('        for (int i = 2; i <= 10; i += 2) {\n            System.out.println(i);\n        }')
    },
    {
      id: 'u5-3', title: 'Adding things up',
      learn: `
<p>A very common pattern: create a variable <strong>before</strong> the loop, and add to it on every lap.</p>
<pre><code>int total = 0;
for (int i = 1; i &lt;= 4; i++) {
    total += i;
}
System.out.println(total);  // 1+2+3+4 = 10</code></pre>
<p>Print <strong>after</strong> the loop, outside its braces. Otherwise you'll print on every lap.</p>`,
      tasks: [
        { text: 'Use a loop to add up every number from 1 to 100', tests: [{ type: 'code', pattern: '\\b(for|while)\\s*\\(', msg: 'Use a loop.' }, { type: 'notCode', pattern: '5050', msg: 'Let the loop calculate it. Don\'t type 5050 yourself.' }] },
        { text: 'Print the total once, after the loop', tests: [{ type: 'output', expected: '5050' }] }
      ],
      starter: S(W),
      hint: 'Same as the example, but loop to 100.',
      solution: S('        int total = 0;\n        for (int i = 1; i <= 100; i++) {\n            total += i;\n        }\n        System.out.println(total);')
    },
    {
      id: 'u5-4', title: 'Nested loops',
      learn: `
<p>A loop inside a loop. The inner loop runs completely for <strong>each</strong> lap of the outer loop:</p>
<pre><code>for (int row = 0; row &lt; 2; row++) {
    for (int col = 0; col &lt; 3; col++) {
        System.out.print("#");
    }
    System.out.println();   // end the row
}
// ###
// ###</code></pre>
<p><code>System.out.println()</code> with nothing inside just moves to a new line.</p>`,
      tasks: [
        { text: 'Use two nested <code>for</code> loops', tests: [{ type: 'codeCount', pattern: '\\bfor\\s*\\(', min: 2, msg: 'Use two for loops, one inside the other.' }] },
        { text: 'Print a grid of <code>*</code> that is 3 rows tall and 4 columns wide', tests: [{ type: 'output', expected: '****\n****\n****' }] }
      ],
      starter: S(W),
      hint: 'Outer loop runs 3 times (rows), inner loop runs 4 times and prints <code>*</code> with <code>print</code>, then <code>println()</code> after the inner loop.',
      solution: S('        for (int row = 0; row < 3; row++) {\n            for (int col = 0; col < 4; col++) {\n                System.out.print("*");\n            }\n            System.out.println();\n        }')
    },
    {
      id: 'u5-5', title: 'Project: FizzBuzz',
      learn: `
<p>A famous programming test. For each number from 1 to 15:</p>
<ul>
<li>If it's divisible by 3 <strong>and</strong> 5, print <code>FizzBuzz</code></li>
<li>Otherwise, if divisible by 3, print <code>Fizz</code></li>
<li>Otherwise, if divisible by 5, print <code>Buzz</code></li>
<li>Otherwise, print the number</li>
</ul>
<p>"Divisible by 3" means <code>n % 3 == 0</code>. Think about which check has to come first.</p>`,
      tasks: [
        { text: 'Use a loop with <code>%</code> checks', tests: [{ type: 'code', pattern: '\\b(for|while)\\s*\\(', msg: 'Use a loop.' }, { type: 'code', pattern: '%', msg: 'Use % to test divisibility.' }] },
        { text: 'Print FizzBuzz for 1 to 15', tests: [{ type: 'output', expected: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' }] }
      ],
      starter: S(W),
      hint: 'Check <code>i % 3 == 0 &amp;&amp; i % 5 == 0</code> <strong>first</strong>, otherwise 15 would print "Fizz".',
      solution: S('        for (int i = 1; i <= 15; i++) {\n            if (i % 3 == 0 && i % 5 == 0) {\n                System.out.println("FizzBuzz");\n            } else if (i % 3 == 0) {\n                System.out.println("Fizz");\n            } else if (i % 5 == 0) {\n                System.out.println("Buzz");\n            } else {\n                System.out.println(i);\n            }\n        }')
    }
  ]},

  // ───────────────────────── UNIT 6 ─────────────────────────
  { id: 'u6', title: 'Methods', exercises: [
    {
      id: 'u6-1', title: 'Your own method',
      learn: `
<p>A <strong>method</strong> is a named block of code you can run whenever you want by <em>calling</em> it. You've been using one all along: <code>main</code>.</p>
<pre><code>public class Main {
    static void cheer() {
        System.out.println("Go team!");
    }

    public static void main(String[] args) {
        cheer();
        cheer();
    }
}</code></pre>
<ul>
<li>Methods go <strong>inside the class</strong> but <strong>outside</strong> <code>main</code>.</li>
<li><code>static</code>: for now, every method you write needs it.</li>
<li><code>void</code> means the method doesn't give back a value.</li>
<li>Call it with its name and brackets: <code>cheer();</code></li>
</ul>`,
      tasks: [
        { text: 'Create a method <code>static void greet()</code> that prints <code>Hello from a method</code>', tests: [{ type: 'code', pattern: 'static\\s+void\\s+greet\\s*\\(\\s*\\)', msg: 'Create: static void greet() { ... }' }] },
        { text: 'Call <code>greet()</code> three times from <code>main</code>', tests: [{ type: 'codeCount', pattern: '\\bgreet\\s*\\(\\s*\\)\\s*;', min: 3, msg: 'Call greet(); three times inside main.' }, { type: 'output', expected: 'Hello from a method\nHello from a method\nHello from a method' }] }
      ],
      starter: 'public class Main {\n    // Create your greet method here\n\n    public static void main(String[] args) {\n        // Call it three times here\n\n    }\n}\n',
      hint: 'Copy the <code>cheer</code> example, rename it to <code>greet</code> and change the message.',
      solution: 'public class Main {\n    static void greet() {\n        System.out.println("Hello from a method");\n    }\n\n    public static void main(String[] args) {\n        greet();\n        greet();\n        greet();\n    }\n}\n'
    },
    {
      id: 'u6-2', title: 'Parameters',
      learn: `
<p><strong>Parameters</strong> let you pass values into a method. Declare them like variables, inside the brackets:</p>
<pre><code>static void printDouble(int n) {
    System.out.println(n * 2);
}

// in main:
printDouble(5);   // 10
printDouble(21);  // 42</code></pre>
<p>Use commas for more than one: <code>static void show(String name, int age)</code>.</p>
<p>From here on, the checker also runs your method with its <strong>own hidden values</strong>, so it has to work for any input, not just the example.</p>`,
      tasks: [
        { text: 'Create <code>static void printSquare(int n)</code> that prints <code>n</code> times <code>n</code>', tests: [{ type: 'harness', id: 'sq7', msg: 'printSquare(7) should print 49.' }, { type: 'harness', id: 'sq0', msg: 'printSquare(0) should print 0.' }] },
        { text: 'In <code>main</code>, call it with <code>4</code> and then <code>9</code>', tests: [{ type: 'output', expected: '16\n81' }] }
      ],
      harness: { signature: 'static void printSquare(int n)', tests: [
        { id: 'sq7', java: 'capture(() -> Main.printSquare(7)).equals("49")', got: 'capture(() -> Main.printSquare(7))' },
        { id: 'sq0', java: 'capture(() -> Main.printSquare(0)).equals("0")', got: 'capture(() -> Main.printSquare(0))' }
      ]},
      starter: 'public class Main {\n    // Create printSquare here\n\n    public static void main(String[] args) {\n\n    }\n}\n',
      hint: '<code>static void printSquare(int n) { System.out.println(n * n); }</code>, then <code>printSquare(4);</code> and <code>printSquare(9);</code> in main.',
      solution: 'public class Main {\n    static void printSquare(int n) {\n        System.out.println(n * n);\n    }\n\n    public static void main(String[] args) {\n        printSquare(4);\n        printSquare(9);\n    }\n}\n'
    },
    {
      id: 'u6-3', title: 'Return values',
      learn: `
<p>Instead of printing, a method can <strong>give back</strong> a value with <code>return</code>. Replace <code>void</code> with the type you're returning:</p>
<pre><code>static int triple(int n) {
    return n * 3;
}

// in main:
int x = triple(4);       // x is 12
System.out.println(triple(10));  // 30</code></pre>
<p>Returning is more useful than printing, because the caller decides what to do with the result.</p>`,
      tasks: [
        { text: 'Create <code>static int add(int a, int b)</code> that <strong>returns</strong> the sum', tests: [{ type: 'harness', id: 'add1', msg: 'add(10, -4) should return 6.' }, { type: 'harness', id: 'add2', msg: 'add(0, 0) should return 0.' }, { type: 'harness', id: 'add3', msg: 'add(250, 750) should return 1000.' }] },
        { text: 'In <code>main</code>, print <code>add(2, 3)</code>', tests: [{ type: 'output', expected: '5' }] }
      ],
      harness: { signature: 'static int add(int a, int b)', tests: [
        { id: 'add1', java: 'Main.add(10, -4) == 6', got: 'Main.add(10, -4)' },
        { id: 'add2', java: 'Main.add(0, 0) == 0', got: 'Main.add(0, 0)' },
        { id: 'add3', java: 'Main.add(250, 750) == 1000', got: 'Main.add(250, 750)' }
      ]},
      starter: 'public class Main {\n    // Create add here\n\n    public static void main(String[] args) {\n\n    }\n}\n',
      hint: '<code>static int add(int a, int b) { return a + b; }</code>',
      solution: 'public class Main {\n    static int add(int a, int b) {\n        return a + b;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(add(2, 3));\n    }\n}\n'
    },
    {
      id: 'u6-4', title: 'Returning booleans',
      learn: `
<p>Methods that answer a yes/no question return a <code>boolean</code>. Since a comparison already <em>is</em> a boolean, you can return it directly:</p>
<pre><code>static boolean isAdult(int age) {
    return age &gt;= 18;
}</code></pre>
<p>That's cleaner than an if/else that returns true or false.</p>`,
      tasks: [
        { text: 'Create <code>static boolean isEven(int n)</code>', tests: [{ type: 'harness', id: 'ev4', msg: 'isEven(4) should return true.' }, { type: 'harness', id: 'ev7', msg: 'isEven(7) should return false.' }, { type: 'harness', id: 'ev0', msg: 'isEven(0) should return true.' }, { type: 'harness', id: 'evn', msg: 'isEven(-3) should return false.' }] },
        { text: 'In <code>main</code>, print <code>isEven(10)</code> and then <code>isEven(15)</code>', tests: [{ type: 'output', expected: 'true\nfalse' }] }
      ],
      harness: { signature: 'static boolean isEven(int n)', tests: [
        { id: 'ev4', java: 'Main.isEven(4) == true', got: 'Main.isEven(4)' },
        { id: 'ev7', java: 'Main.isEven(7) == false', got: 'Main.isEven(7)' },
        { id: 'ev0', java: 'Main.isEven(0) == true', got: 'Main.isEven(0)' },
        { id: 'evn', java: 'Main.isEven(-3) == false', got: 'Main.isEven(-3)' }
      ]},
      starter: 'public class Main {\n    // Create isEven here\n\n    public static void main(String[] args) {\n\n    }\n}\n',
      hint: 'Even means the remainder after dividing by 2 is 0: <code>return n % 2 == 0;</code>',
      solution: 'public class Main {\n    static boolean isEven(int n) {\n        return n % 2 == 0;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(isEven(10));\n        System.out.println(isEven(15));\n    }\n}\n'
    },
    {
      id: 'u6-5', title: 'Project: biggest of three',
      learn: `
<p>Write a method that takes three numbers and returns the largest one, <strong>without using Math.max</strong>. You'll need if statements.</p>
<p>Tip: store the first number as the "best so far", then compare it with each of the others.</p>`,
      tasks: [
        { text: 'Create <code>static int maxOfThree(int a, int b, int c)</code> without <code>Math.max</code>', tests: [{ type: 'notCode', pattern: 'Math\\.max', msg: 'Solve it without Math.max.' }, { type: 'harness', id: 'm1', msg: 'maxOfThree(1, 2, 3) should return 3.' }, { type: 'harness', id: 'm2', msg: 'maxOfThree(9, 2, 3) should return 9.' }, { type: 'harness', id: 'm3', msg: 'maxOfThree(4, 8, 1) should return 8.' }, { type: 'harness', id: 'm4', msg: 'maxOfThree(-5, -2, -9) should return -2.' }, { type: 'harness', id: 'm5', msg: 'maxOfThree(7, 7, 7) should return 7.' }] },
        { text: 'In <code>main</code>, print <code>maxOfThree(12, 47, 30)</code>', tests: [{ type: 'output', expected: '47' }] }
      ],
      harness: { signature: 'static int maxOfThree(int a, int b, int c)', tests: [
        { id: 'm1', java: 'Main.maxOfThree(1, 2, 3) == 3', got: 'Main.maxOfThree(1, 2, 3)' },
        { id: 'm2', java: 'Main.maxOfThree(9, 2, 3) == 9', got: 'Main.maxOfThree(9, 2, 3)' },
        { id: 'm3', java: 'Main.maxOfThree(4, 8, 1) == 8', got: 'Main.maxOfThree(4, 8, 1)' },
        { id: 'm4', java: 'Main.maxOfThree(-5, -2, -9) == -2', got: 'Main.maxOfThree(-5, -2, -9)' },
        { id: 'm5', java: 'Main.maxOfThree(7, 7, 7) == 7', got: 'Main.maxOfThree(7, 7, 7)' }
      ]},
      starter: 'public class Main {\n    // Create maxOfThree here\n\n    public static void main(String[] args) {\n\n    }\n}\n',
      hint: '<code>int best = a; if (b &gt; best) best = b; if (c &gt; best) best = c; return best;</code>',
      solution: 'public class Main {\n    static int maxOfThree(int a, int b, int c) {\n        int best = a;\n        if (b > best) {\n            best = b;\n        }\n        if (c > best) {\n            best = c;\n        }\n        return best;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(maxOfThree(12, 47, 30));\n    }\n}\n'
    }
  ]},

  // ───────────────────────── UNIT 7 ─────────────────────────
  { id: 'u7', title: 'Arrays and lists', exercises: [
    {
      id: 'u7-1', title: 'Arrays',
      learn: `
<p>An <strong>array</strong> stores several values of the same type in one variable:</p>
<pre><code>int[] laps = {62, 58, 60, 57};</code></pre>
<ul>
<li>Get an item with its <strong>index</strong> in square brackets. Indexes start at <strong>0</strong>: <code>laps[0]</code> is 62.</li>
<li><code>laps.length</code> is how many items there are (4).</li>
<li>So the last item is <code>laps[laps.length - 1]</code>.</li>
<li>Change an item: <code>laps[1] = 55;</code></li>
</ul>
<p>Asking for an index that doesn't exist (like <code>laps[4]</code>) crashes with an <code>ArrayIndexOutOfBoundsException</code>.</p>`,
      tasks: [
        { text: 'Create <code>int[] scores = {90, 75, 88};</code>', tests: [{ type: 'code', pattern: 'int\\s*\\[\\s*\\]\\s*scores\\s*=\\s*\\{\\s*90\\s*,\\s*75\\s*,\\s*88\\s*\\}', msg: 'Missing: int[] scores = {90, 75, 88};' }] },
        { text: 'Print the first item using index 0', tests: [{ type: 'code', pattern: 'scores\\s*\\[\\s*0\\s*\\]', msg: 'Print scores[0].' }] },
        { text: 'Print the last item using <code>scores.length - 1</code>', tests: [{ type: 'code', pattern: 'scores\\s*\\[\\s*scores\\.length\\s*-\\s*1\\s*\\]', msg: 'Print scores[scores.length - 1].' }] },
        { text: 'Print <code>scores.length</code>', tests: [{ type: 'code', pattern: 'println\\s*\\(\\s*scores\\.length\\s*\\)', msg: 'Print scores.length.' }, { type: 'output', expected: '90\n88\n3' }] }
      ],
      starter: S(W),
      hint: 'Three println statements: <code>scores[0]</code>, <code>scores[scores.length - 1]</code>, <code>scores.length</code>.',
      solution: S('        int[] scores = {90, 75, 88};\n        System.out.println(scores[0]);\n        System.out.println(scores[scores.length - 1]);\n        System.out.println(scores.length);')
    },
    {
      id: 'u7-2', title: 'Looping through arrays',
      learn: `
<p>Use a <code>for</code> loop with the index running from <code>0</code> to <code>length - 1</code>:</p>
<pre><code>String[] parts = {"motor", "gearbox", "wheel"};
for (int i = 0; i &lt; parts.length; i++) {
    System.out.println(i + ": " + parts[i]);
}</code></pre>
<p>If you don't need the index, the <strong>for-each</strong> loop is shorter:</p>
<pre><code>for (String p : parts) {
    System.out.println(p);
}</code></pre>
<p>Read it as "for each String p in parts".</p>`,
      tasks: [
        { text: 'Create <code>String[] planets = {"Mercury", "Venus", "Earth", "Mars"};</code>', tests: [{ type: 'code', pattern: 'String\\s*\\[\\s*\\]\\s*planets\\s*=', msg: 'Create the planets array.' }] },
        { text: 'Use a loop to print each planet on its own line', tests: [{ type: 'code', pattern: '\\bfor\\s*\\(', msg: 'Use a for or for-each loop.' }, { type: 'codeCount', pattern: 'println', min: 1, msg: 'Print inside the loop.' }, { type: 'notCode', pattern: '"Earth"\\s*\\)', msg: 'Print using the loop, not by typing each name into println.' }, { type: 'output', expected: 'Mercury\nVenus\nEarth\nMars' }] }
      ],
      starter: S(W),
      hint: '<code>for (String p : planets) { System.out.println(p); }</code>',
      solution: S('        String[] planets = {"Mercury", "Venus", "Earth", "Mars"};\n        for (String p : planets) {\n            System.out.println(p);\n        }')
    },
    {
      id: 'u7-3', title: 'Sum of an array',
      learn: `
<p>Methods can take arrays as parameters:</p>
<pre><code>static void showAll(int[] nums) {
    for (int n : nums) {
        System.out.println(n);
    }
}</code></pre>
<p>Combine that with the "add things up" pattern from the loops unit.</p>`,
      tasks: [
        { text: 'Create <code>static int sum(int[] nums)</code> that returns the total of all items', tests: [{ type: 'harness', id: 's1', msg: 'sum({1, 2, 3}) should return 6.' }, { type: 'harness', id: 's2', msg: 'sum({}) (empty array) should return 0.' }, { type: 'harness', id: 's3', msg: 'sum({-5, 10, -5, 40}) should return 40.' }] },
        { text: 'In <code>main</code>, print the sum of <code>{4, 8, 15, 16, 23, 42}</code>', tests: [{ type: 'output', expected: '108' }] }
      ],
      harness: { signature: 'static int sum(int[] nums)', tests: [
        { id: 's1', java: 'Main.sum(new int[]{1, 2, 3}) == 6', got: 'Main.sum(new int[]{1, 2, 3})' },
        { id: 's2', java: 'Main.sum(new int[]{}) == 0', got: 'Main.sum(new int[]{})' },
        { id: 's3', java: 'Main.sum(new int[]{-5, 10, -5, 40}) == 40', got: 'Main.sum(new int[]{-5, 10, -5, 40})' }
      ]},
      starter: 'public class Main {\n    // Create sum here\n\n    public static void main(String[] args) {\n        int[] numbers = {4, 8, 15, 16, 23, 42};\n\n    }\n}\n',
      hint: '<code>int total = 0; for (int n : nums) { total += n; } return total;</code>',
      solution: 'public class Main {\n    static int sum(int[] nums) {\n        int total = 0;\n        for (int n : nums) {\n            total += n;\n        }\n        return total;\n    }\n\n    public static void main(String[] args) {\n        int[] numbers = {4, 8, 15, 16, 23, 42};\n        System.out.println(sum(numbers));\n    }\n}\n'
    },
    {
      id: 'u7-4', title: 'Finding the biggest',
      learn: `
<p>To find the largest item, start with the <strong>first item</strong> as your best guess, then loop through and replace it whenever you find something bigger.</p>
<p>Don't start your best guess at <code>0</code>. If every number is negative, 0 would wrongly win.</p>`,
      tasks: [
        { text: 'Create <code>static int findMax(int[] nums)</code> (assume the array has at least one item)', tests: [{ type: 'harness', id: 'f1', msg: 'findMax({3, 9, 2}) should return 9.' }, { type: 'harness', id: 'f2', msg: 'findMax({-8, -3, -12}) should return -3.' }, { type: 'harness', id: 'f3', msg: 'findMax({5}) should return 5.' }, { type: 'harness', id: 'f4', msg: 'findMax({1, 2, 3, 100}) should return 100.' }] },
        { text: 'In <code>main</code>, print <code>findMax</code> of <code>{12, 87, 45, 3}</code>', tests: [{ type: 'output', expected: '87' }] }
      ],
      harness: { signature: 'static int findMax(int[] nums)', tests: [
        { id: 'f1', java: 'Main.findMax(new int[]{3, 9, 2}) == 9', got: 'Main.findMax(new int[]{3, 9, 2})' },
        { id: 'f2', java: 'Main.findMax(new int[]{-8, -3, -12}) == -3', got: 'Main.findMax(new int[]{-8, -3, -12})' },
        { id: 'f3', java: 'Main.findMax(new int[]{5}) == 5', got: 'Main.findMax(new int[]{5})' },
        { id: 'f4', java: 'Main.findMax(new int[]{1, 2, 3, 100}) == 100', got: 'Main.findMax(new int[]{1, 2, 3, 100})' }
      ]},
      starter: 'public class Main {\n    // Create findMax here\n\n    public static void main(String[] args) {\n        int[] numbers = {12, 87, 45, 3};\n\n    }\n}\n',
      hint: '<code>int best = nums[0];</code> then loop and <code>if (n &gt; best) best = n;</code>',
      solution: 'public class Main {\n    static int findMax(int[] nums) {\n        int best = nums[0];\n        for (int n : nums) {\n            if (n > best) {\n                best = n;\n            }\n        }\n        return best;\n    }\n\n    public static void main(String[] args) {\n        int[] numbers = {12, 87, 45, 3};\n        System.out.println(findMax(numbers));\n    }\n}\n'
    },
    {
      id: 'u7-5', title: 'ArrayList',
      learn: `
<p>Arrays have a fixed size. An <code>ArrayList</code> can grow and shrink. You need an import at the very top of the file:</p>
<pre><code>import java.util.ArrayList;

public class Main {
    public static void main(String[] args) {
        ArrayList&lt;String&gt; list = new ArrayList&lt;String&gt;();
        list.add("bolt");
        list.add("nut");
        System.out.println(list.size());   // 2
        System.out.println(list.get(0));   // bolt
        list.remove(0);                    // removes "bolt"
    }
}</code></pre>
<p>The type goes in angle brackets. For numbers, use <code>Integer</code> instead of <code>int</code>: <code>ArrayList&lt;Integer&gt;</code>.</p>`,
      tasks: [
        { text: 'Import <code>java.util.ArrayList</code> and create an <code>ArrayList&lt;String&gt;</code> called <code>tasks</code>', tests: [{ type: 'code', pattern: 'import\\s+java\\.util\\.(ArrayList|\\*)\\s*;', msg: 'Add import java.util.ArrayList; at the top.' }, { type: 'code', pattern: 'ArrayList\\s*<\\s*String\\s*>\\s*tasks\\s*=', msg: 'Create: ArrayList<String> tasks = new ArrayList<String>();' }] },
        { text: 'Add <code>"wire motors"</code>, <code>"test code"</code> and <code>"tighten bolts"</code>', tests: [{ type: 'codeCount', pattern: 'tasks\\.add\\s*\\(', min: 3, msg: 'Call tasks.add(...) three times.' }] },
        { text: 'Remove the first item, then print <code>tasks.size()</code> and <code>tasks.get(0)</code>', tests: [{ type: 'code', pattern: 'tasks\\.remove\\s*\\(', msg: 'Use tasks.remove(0).' }, { type: 'output', expected: '2\ntest code' }] }
      ],
      starter: '// Add your import here\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code below\n\n    }\n}\n',
      hint: 'After removing index 0, "test code" moves into index 0.',
      solution: 'import java.util.ArrayList;\n\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<String> tasks = new ArrayList<String>();\n        tasks.add("wire motors");\n        tasks.add("test code");\n        tasks.add("tighten bolts");\n        tasks.remove(0);\n        System.out.println(tasks.size());\n        System.out.println(tasks.get(0));\n    }\n}\n'
    }
  ]},

  // ───────────────────────── UNIT 8 ─────────────────────────
  { id: 'u8', title: 'Classes and objects', exercises: [
    {
      id: 'u8-1', title: 'Your first class',
      learn: `
<p>A <strong>class</strong> is a blueprint. An <strong>object</strong> is one thing built from that blueprint. Classes group related data (<em>fields</em>) together:</p>
<pre><code>class Motor {
    String name;
    int maxRpm;
}

public class Main {
    public static void main(String[] args) {
        Motor m = new Motor();   // build an object
        m.name = "NEO";
        m.maxRpm = 5676;
        System.out.println(m.name + " " + m.maxRpm);
    }
}</code></pre>
<ul>
<li>Extra classes can go in the same file, below <code>Main</code>, without <code>public</code>.</li>
<li><code>new Motor()</code> creates an object.</li>
<li>Use a dot to reach its fields: <code>m.name</code>.</li>
</ul>`,
      tasks: [
        { text: 'Create a class <code>Book</code> with fields <code>String title</code> and <code>int pages</code>', tests: [{ type: 'code', pattern: 'class\\s+Book\\b', msg: 'Create class Book { ... } below Main.' }, { type: 'harness', id: 'b1', msg: 'Book needs fields String title and int pages.' }] },
        { text: 'In <code>main</code>, make a Book with title <code>Dune</code> and 412 pages, then print <code>Dune has 412 pages</code>', tests: [{ type: 'code', pattern: 'new\\s+Book\\s*\\(', msg: 'Create a Book with new Book().' }, { type: 'output', expected: 'Dune has 412 pages' }] }
      ],
      harness: { signature: 'class Book { String title; int pages; }', tests: [
        { id: 'b1', java: 'new Object() { boolean go() { Book b = new Book(); b.title = "X"; b.pages = 3; return b.title.equals("X") && b.pages == 3; } }.go()' }
      ]},
      starter: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code below\n\n    }\n}\n\n// Create the Book class here\n',
      hint: '<code>class Book { String title; int pages; }</code>, then in main <code>Book b = new Book(); b.title = "Dune"; ...</code>',
      solution: 'public class Main {\n    public static void main(String[] args) {\n        Book b = new Book();\n        b.title = "Dune";\n        b.pages = 412;\n        System.out.println(b.title + " has " + b.pages + " pages");\n    }\n}\n\nclass Book {\n    String title;\n    int pages;\n}\n'
    },
    {
      id: 'u8-2', title: 'Constructors',
      learn: `
<p>A <strong>constructor</strong> sets up an object when it's created, so you don't have to set every field by hand. It has the <strong>same name as the class</strong> and no return type:</p>
<pre><code>class Motor {
    String name;
    int maxRpm;

    Motor(String name, int maxRpm) {
        this.name = name;
        this.maxRpm = maxRpm;
    }
}

// in main:
Motor m = new Motor("NEO", 5676);</code></pre>
<p><code>this.name</code> means "this object's field", which is different from the parameter <code>name</code>.</p>`,
      tasks: [
        { text: 'Give <code>Book</code> a constructor <code>Book(String title, int pages)</code> that sets both fields', tests: [{ type: 'harness', id: 'c1', msg: 'new Book("Hatchet", 195) should set title to "Hatchet" and pages to 195.' }, { type: 'harness', id: 'c2', msg: 'new Book("A", 1) should set title to "A" and pages to 1.' }] },
        { text: 'In <code>main</code>, create <code>new Book("Dune", 412)</code> and print <code>Dune has 412 pages</code>', tests: [{ type: 'code', pattern: 'new\\s+Book\\s*\\(\\s*"Dune"\\s*,\\s*412\\s*\\)', msg: 'Use new Book("Dune", 412).' }, { type: 'output', expected: 'Dune has 412 pages' }] }
      ],
      harness: { signature: 'Book(String title, int pages)', tests: [
        { id: 'c1', java: 'new Book("Hatchet", 195).title.equals("Hatchet") && new Book("Hatchet", 195).pages == 195', got: 'new Book("Hatchet", 195).title + ", " + new Book("Hatchet", 195).pages' },
        { id: 'c2', java: 'new Book("A", 1).title.equals("A") && new Book("A", 1).pages == 1', got: 'new Book("A", 1).title + ", " + new Book("A", 1).pages' }
      ]},
      starter: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code below\n\n    }\n}\n\nclass Book {\n    String title;\n    int pages;\n\n    // Add a constructor here\n}\n',
      hint: '<code>Book(String title, int pages) { this.title = title; this.pages = pages; }</code>',
      solution: 'public class Main {\n    public static void main(String[] args) {\n        Book b = new Book("Dune", 412);\n        System.out.println(b.title + " has " + b.pages + " pages");\n    }\n}\n\nclass Book {\n    String title;\n    int pages;\n\n    Book(String title, int pages) {\n        this.title = title;\n        this.pages = pages;\n    }\n}\n'
    },
    {
      id: 'u8-3', title: 'Methods and private fields',
      learn: `
<p>Objects can have their own methods, and these <strong>don't</strong> use <code>static</code>. Make fields <code>private</code> so other code can only change them through your methods. This lets the class enforce its own rules:</p>
<pre><code>class Tank {
    private double litres;

    void fill(double amount) {
        if (amount &gt; 0) {
            litres += amount;
        }
    }

    double getLitres() {
        return litres;
    }
}</code></pre>
<p>Now nobody can set <code>litres</code> to −50 from outside the class.</p>`,
      tasks: [
        { text: 'Create a class <code>BankAccount</code> with a <code>private double balance</code>', tests: [{ type: 'code', pattern: 'private\\s+double\\s+balance', msg: 'Add: private double balance;' }] },
        { text: 'Add <code>void deposit(double amount)</code> that only adds positive amounts', tests: [{ type: 'harness', id: 'd1', msg: 'Depositing 50 then 25.5 should give a balance of 75.5.' }, { type: 'harness', id: 'd2', msg: 'deposit(-20) should be ignored.' }] },
        { text: 'Add <code>boolean withdraw(double amount)</code>: if there is enough money, subtract it and return true; otherwise change nothing and return false', tests: [{ type: 'harness', id: 'w1', msg: 'With 100, withdraw(30) should return true and leave 70.' }, { type: 'harness', id: 'w2', msg: 'With 100, withdraw(150) should return false and leave 100.' }] },
        { text: 'Add <code>double getBalance()</code>', tests: [{ type: 'harness', id: 'g1', msg: 'A new account\'s getBalance() should be 0.' }] }
      ],
      harness: { signature: 'class BankAccount { void deposit(double amount); boolean withdraw(double amount); double getBalance(); }', tests: [
        { id: 'd1', java: 'new Object() { boolean go() { BankAccount a = new BankAccount(); a.deposit(50); a.deposit(25.5); return near(a.getBalance(), 75.5); } }.go()' },
        { id: 'd2', java: 'new Object() { boolean go() { BankAccount a = new BankAccount(); a.deposit(10); a.deposit(-20); return near(a.getBalance(), 10); } }.go()' },
        { id: 'w1', java: 'new Object() { boolean go() { BankAccount a = new BankAccount(); a.deposit(100); boolean r = a.withdraw(30); return r && near(a.getBalance(), 70); } }.go()' },
        { id: 'w2', java: 'new Object() { boolean go() { BankAccount a = new BankAccount(); a.deposit(100); boolean r = a.withdraw(150); return !r && near(a.getBalance(), 100); } }.go()' },
        { id: 'g1', java: 'near(new BankAccount().getBalance(), 0)' }
      ]},
      starter: 'public class Main {\n    public static void main(String[] args) {\n        BankAccount acct = new BankAccount();\n        acct.deposit(100);\n        System.out.println(acct.withdraw(40));\n        System.out.println(acct.withdraw(500));\n        System.out.println(acct.getBalance());\n    }\n}\n\n// Create the BankAccount class here\n',
      hint: 'In <code>withdraw</code>: <code>if (amount &lt;= balance) { balance -= amount; return true; } return false;</code>',
      solution: 'public class Main {\n    public static void main(String[] args) {\n        BankAccount acct = new BankAccount();\n        acct.deposit(100);\n        System.out.println(acct.withdraw(40));\n        System.out.println(acct.withdraw(500));\n        System.out.println(acct.getBalance());\n    }\n}\n\nclass BankAccount {\n    private double balance;\n\n    void deposit(double amount) {\n        if (amount > 0) {\n            balance += amount;\n        }\n    }\n\n    boolean withdraw(double amount) {\n        if (amount <= balance) {\n            balance -= amount;\n            return true;\n        }\n        return false;\n    }\n\n    double getBalance() {\n        return balance;\n    }\n}\n'
    },
    {
      id: 'u8-4', title: 'Project: Rectangle',
      learn: `
<p>Put it all together: a class with private fields, a constructor and methods that return calculated values.</p>
<p>A rectangle with width 4 and height 3 has:</p>
<ul>
<li>area = width × height = 12</li>
<li>perimeter = 2 × (width + height) = 14</li>
<li>it's a square only if width equals height</li>
</ul>`,
      tasks: [
        { text: 'Create <code>Rectangle</code> with <code>private double width, height</code> and a constructor <code>Rectangle(double width, double height)</code>', tests: [{ type: 'code', pattern: 'private\\s+double', msg: 'Make the fields private double.' }, { type: 'harness', id: 'r0', msg: 'new Rectangle(4, 3) should compile and work.' }] },
        { text: 'Add <code>double area()</code> and <code>double perimeter()</code>', tests: [{ type: 'harness', id: 'r1', msg: 'Rectangle(4, 3).area() should be 12.' }, { type: 'harness', id: 'r2', msg: 'Rectangle(2.5, 2).area() should be 5.' }, { type: 'harness', id: 'r3', msg: 'Rectangle(4, 3).perimeter() should be 14.' }] },
        { text: 'Add <code>boolean isSquare()</code>', tests: [{ type: 'harness', id: 'r4', msg: 'Rectangle(5, 5).isSquare() should be true.' }, { type: 'harness', id: 'r5', msg: 'Rectangle(5, 6).isSquare() should be false.' }] },
        { text: 'Run the provided <code>main</code> to see your results', tests: [{ type: 'output', expected: '12.0\n14.0\nfalse' }] }
      ],
      harness: { signature: 'class Rectangle { Rectangle(double width, double height); double area(); double perimeter(); boolean isSquare(); }', tests: [
        { id: 'r0', java: 'new Rectangle(4, 3) != null' },
        { id: 'r1', java: 'near(new Rectangle(4, 3).area(), 12)', got: 'new Rectangle(4, 3).area()' },
        { id: 'r2', java: 'near(new Rectangle(2.5, 2).area(), 5)', got: 'new Rectangle(2.5, 2).area()' },
        { id: 'r3', java: 'near(new Rectangle(4, 3).perimeter(), 14)', got: 'new Rectangle(4, 3).perimeter()' },
        { id: 'r4', java: 'new Rectangle(5, 5).isSquare() == true', got: 'new Rectangle(5, 5).isSquare()' },
        { id: 'r5', java: 'new Rectangle(5, 6).isSquare() == false', got: 'new Rectangle(5, 6).isSquare()' }
      ]},
      starter: 'public class Main {\n    public static void main(String[] args) {\n        Rectangle r = new Rectangle(4, 3);\n        System.out.println(r.area());\n        System.out.println(r.perimeter());\n        System.out.println(r.isSquare());\n    }\n}\n\n// Create the Rectangle class here\n',
      hint: 'Copy the structure from the Book constructor and the BankAccount methods. <code>isSquare</code> can just <code>return width == height;</code>',
      solution: 'public class Main {\n    public static void main(String[] args) {\n        Rectangle r = new Rectangle(4, 3);\n        System.out.println(r.area());\n        System.out.println(r.perimeter());\n        System.out.println(r.isSquare());\n    }\n}\n\nclass Rectangle {\n    private double width;\n    private double height;\n\n    Rectangle(double width, double height) {\n        this.width = width;\n        this.height = height;\n    }\n\n    double area() {\n        return width * height;\n    }\n\n    double perimeter() {\n        return 2 * (width + height);\n    }\n\n    boolean isSquare() {\n        return width == height;\n    }\n}\n'
    }
  ]}
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = CURRICULUM;
  else root.CURRICULUM = CURRICULUM;
})(this);
