// Turns javac and runtime error text into plain-English explanations.
(function (root) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function symbolFrom(detail) {
    const m = detail.match(/symbol:\s+(variable|method|class)\s+([^\s(]+)/);
    return m ? { kind: m[1], name: m[2] } : null;
  }

  const COMPILE_RULES = [
    [/';' expected/, () => 'Missing semicolon. Statements end with <code>;</code>. The error often points just after the line that is missing it.'],
    [/unclosed string literal/, () => 'A String is missing its closing double quote <code>"</code>.'],
    [/unclosed character literal/, () => 'A <code>char</code> uses single quotes around exactly one character, like <code>\'A\'</code>. For text, use double quotes and a String.'],
    [/reached end of file while parsing/, () => 'Missing a closing curly brace <code>}</code>. Every <code>{</code> needs a matching <code>}</code>.'],
    [/class, interface, (enum, )?or .*expected/, () => 'Something is outside the class, or there is an extra <code>}</code> that closed the class too early.'],
    [/illegal start of (expression|type)/, () => 'Java hit something it didn\'t expect here. Common causes: a missing <code>}</code> above this line, or a method written inside <code>main</code> (methods go outside it).'],
    [/<identifier> expected/, () => 'Java expected a name here. Usually this means a statement is sitting directly in the class instead of inside a method like <code>main</code>.'],
    [/package system does not exist/, () => 'Capitals matter: it\'s <code>System</code> with a capital S.'],
    [/package (\S+) does not exist/, (l, d, m) => 'Java doesn\'t recognise <code>' + esc(m[1]) + '</code>. Check spelling and capitals (for example <code>System.out</code>), or the import at the top.'],
    [/cannot find symbol/, (line, detail) => {
      const s = symbolFrom(detail);
      if (s && /^system$/.test(s.name) || /\bsystem\.out/.test(detail)) return 'Capitals matter: it\'s <code>System</code> with a capital S.';
      if (s && s.name === 'string') return 'Capitals matter: the type is <code>String</code> with a capital S.';
      if (s && s.kind === 'variable') return 'Java doesn\'t know a variable called <code>' + esc(s.name) + '</code>. Check the spelling and capitals, make sure you created it (with its type) before using it, and that it isn\'t declared inside a different set of braces.';
      if (s && s.kind === 'method') return 'Java can\'t find a method called <code>' + esc(s.name) + '</code> that takes these inputs. Check the spelling, the capitals and the number and types of arguments.';
      if (s && s.kind === 'class') return 'Java doesn\'t know a class called <code>' + esc(s.name) + '</code>. Check the spelling and capitals, or whether you need an <code>import</code> at the top.';
      return 'Java doesn\'t recognise a name here. Check the spelling and capitals.';
    }],
    [/possible lossy conversion from double to int/, () => 'You\'re putting a decimal value into an <code>int</code>, which can only hold whole numbers. Make the variable a <code>double</code>, or cast with <code>(int)</code> if you want to chop off the decimals.'],
    [/incompatible types: String cannot be converted to (int|double|boolean|char)/, (l, d, m) => 'That\'s text (a String) but the variable is a number or boolean type. Remove the quotes, or change the variable type to <code>String</code>.'],
    [/incompatible types: (int|double) cannot be converted to String/, () => 'You\'re putting a number into a String variable. Use a number type, or turn it into text with <code>"" + value</code>.'],
    [/incompatible types: (int|double) cannot be converted to boolean/, () => 'A condition must be true/false. Did you write <code>=</code> (assign) instead of <code>==</code> (compare)?'],
    [/incompatible types/, () => 'The value\'s type doesn\'t match what\'s expected here. Check the variable type and the method\'s return type.'],
    [/missing return statement/, () => 'This method promises to return a value, but some path through it doesn\'t reach a <code>return</code>. Make sure every possible path returns something.'],
    [/variable (\S+) is already defined/, (l, d, m) => 'You created <code>' + esc(m[1]) + '</code> twice. To change an existing variable, leave off the type: write <code>' + esc(m[1]) + ' = ...;</code>, not <code>int ' + esc(m[1]) + ' = ...;</code>.'],
    [/variable (\S+) might not have been initialized/, (l, d, m) => '<code>' + esc(m[1]) + '</code> is used before it has a value. Give it a starting value when you create it.'],
    [/bad operand types? for (binary|unary) operator '(.+?)'/, (l, d, m) => 'The <code>' + esc(m[2]) + '</code> operator can\'t be used with these types. For example, <code>&amp;&amp;</code> needs booleans on both sides, and Strings are compared with <code>.equals()</code>.'],
    [/class (\S+) is public, should be declared in a file named/, (l, d, m) => 'The file is <code>Main.java</code>, so the public class must be named <code>Main</code>, not <code>' + esc(m[1]) + '</code>.'],
    [/non-static (method|variable) (\S+) cannot be referenced from a static context/, (l, d, m) => '<code>main</code> is <code>static</code>, so it can only call other <code>static</code> methods directly. Add <code>static</code> to <code>' + esc(m[2].replace(/\(.*/, '')) + '</code>, or call it on an object.'],
    [/method (\S+) in class (\S+) cannot be applied to given types/, (l, d, m) => 'You called <code>' + esc(m[1]) + '</code> with the wrong number or types of arguments. Compare the call with the method\'s parameter list.'],
    [/constructor (\S+) in class (\S+) cannot be applied to given types/, (l, d, m) => 'You called the <code>' + esc(m[1]) + '</code> constructor with the wrong number or types of arguments.'],
    [/not a statement/, () => 'This line computes something but doesn\'t do anything with it. Did you forget to assign it or print it? Text needs double quotes.'],
    [/(int|double|char|boolean) cannot be dereferenced/, (l, d, m) => '<code>' + esc(m[1]) + '</code> is a basic type, so it has no methods. You can\'t use a dot on it (like <code>.equals</code> or <code>.length()</code>). Compare numbers with <code>==</code>.'],
    [/'else' without 'if'/, () => 'This <code>else</code> isn\'t attached to an <code>if</code>. Check for a stray semicolon after <code>if (...)</code> or a missing brace.'],
    [/unreachable statement/, () => 'This line can never run, because it comes after a <code>return</code>, <code>break</code> or an endless loop.'],
    [/'\(' expected|'\)' expected/, () => 'Brackets don\'t match up here. Check that every <code>(</code> has a matching <code>)</code>.'],
    [/'\{' expected/, () => 'Java expected an opening curly brace <code>{</code> here.'],
    [/integer number too large/, () => 'That number is too big for an <code>int</code> (max about 2.1 billion). Use <code>long</code> and put an <code>L</code> on the end: <code>5000000000L</code>.'],
    [/missing method body/, () => 'A method needs a body in curly braces. Check for a semicolon right after the method\'s brackets.'],
    [/invalid method declaration; return type required/, () => 'Methods need a return type (<code>void</code>, <code>int</code>, …). If you meant a constructor, its name must exactly match the class name.']
  ];

  const RUNTIME_RULES = [
    [/ArithmeticException: \/ by zero/, 'Your program divided an integer by zero, which crashes it.'],
    [/ArrayIndexOutOfBoundsException(?:: (?:Index )?(-?\d+))?/, m => 'Your program asked for an array index that doesn\'t exist' + (m[1] ? ' (' + m[1] + ')' : '') + '. Valid indexes go from 0 to <code>length - 1</code>. Check loop conditions: use <code>&lt;</code>, not <code>&lt;=</code>.'],
    [/StringIndexOutOfBoundsException/, 'Your program asked for a character position outside the String.'],
    [/IndexOutOfBoundsException/, 'Your program asked a list for an index that doesn\'t exist. Valid indexes go from 0 to <code>size() - 1</code>.'],
    [/NullPointerException/, 'Your program used something that is <code>null</code> (empty) as if it were an object. Make sure it was created with <code>new</code> or given a value first.'],
    [/NumberFormatException/, 'Your program tried to turn text into a number, but the text wasn\'t a valid number.'],
    [/StackOverflowError/, 'A method kept calling itself forever (infinite recursion).'],
    [/OutOfMemoryError/, 'Your program used too much memory. Often this is a loop that keeps adding to a list forever.'],
    [/ClassCastException/, 'Your program tried to treat an object as a type it isn\'t.']
  ];

  // Parse javac output into [{line, message, source, explanation}]
  function explainCompile(text) {
    const lines = String(text || '').split('\n');
    const errors = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/(?:^|\/)(\w+)\.java:(\d+): error: (.*)$/);
      if (!m) continue;
      const detail = lines.slice(i, i + 5).join('\n');
      const message = m[3];
      let explanation = 'Read the message carefully and look at the line it points to.';
      for (const [re, fn] of COMPILE_RULES) {
        const mm = message.match(re) || detail.match(re);
        if (mm) { explanation = fn(lines[i], detail, mm); break; }
      }
      errors.push({ file: m[1], line: +m[2], message, source: (lines[i + 1] || '').trimEnd(), explanation });
    }
    return errors;
  }

  function explainRuntime(text) {
    const t = String(text || '');
    if (!/Exception|Error/.test(t)) return null;
    const lineMatch = t.match(/at Main\.\w+\(Main\.java:(\d+)\)/);
    for (const [re, msg] of RUNTIME_RULES) {
      const m = t.match(re);
      if (m) return { line: lineMatch ? +lineMatch[1] : null, name: (m[0].match(/\w+(Exception|Error)/) || [''])[0], explanation: typeof msg === 'function' ? msg(m) : msg };
    }
    const ex = t.match(/(\w+(?:Exception|Error))/);
    return ex && /Exception in thread/.test(t) ? { line: lineMatch ? +lineMatch[1] : null, name: ex[1], explanation: 'Your program crashed while running. Read the first line of the error for the reason.' } : null;
  }

  root.Explain = { compile: explainCompile, runtime: explainRuntime, esc };
})(this);
