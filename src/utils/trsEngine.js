// ============================================================================
// YOUR BIG-ENDIAN STRING TERM REWRITING SYSTEM + 64-CELL MATRIX TOKENIZER
// ============================================================================
export const Str = (value) => ({ type: 'Str', value });
export const App = (name, args) => ({ type: 'App', name, args });

const normalizeDigits = (s) => s.replace(/^0+/, '') || '0';
const isStr = (t) => t.type === 'Str';
const isZero = (t) => isStr(t) && t.value === '0';
const isSingleDigit = (t) => isStr(t) && /^[0-9]$/.test(t.value);
const isNonZeroDigit = (t) => isStr(t) && /^[1-9]$/.test(t.value);
const isMultiDigit = (t) => isStr(t) && /^[1-9][0-9]+$/.test(t.value);
const isNormalizedStr = (t) => isStr(t) && /^(0|[1-9][0-9]*)$/.test(t.value);
const splitLast = (s) => [s.slice(0, -1), s.slice(-1)];

const isApp = (t, name, arity) =>
  t.type === 'App' && t.name === name && (arity === undefined || t.args.length === arity);
const isRat = (t) => isApp(t, 'Rat', 2);
const isNeg = (t) => isApp(t, 'Neg', 1);

function tokenizeInput(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '(' || ch === ')' || ch === ',') {
      tokens.push({ type: ch, value: ch });
      i++;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const quote = ch;
      i++;
      let str = '';
      while (i < input.length && input[i] !== quote) {
        if (!/[0-9]/.test(input[i])) throw new Error(`Digits 0-9 only, got "${input[i]}"`);
        str += input[i++];
      }
      if (input[i] !== quote) throw new Error('Unterminated string literal');
      i++;
      tokens.push({ type: 'STR', value: str });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < input.length && /[0-9]/.test(input[i])) num += input[i++];
      tokens.push({ type: 'STR', value: num });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let id = '';
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) id += input[i++];
      tokens.push({ type: 'IDENT', value: id });
      continue;
    }
    throw new Error(`Unexpected character "${ch}"`);
  }
  return tokens;
}

export function parseTerm(input) {
  const tokens = tokenizeInput(input);
  let pos = 0;
  const peek = () => tokens[pos];
  const consume = (expected) => {
    const tok = tokens[pos];
    if (!tok || (expected && tok.type !== expected)) {
      throw new Error(`Expected ${expected}, got ${tok ? tok.value : 'EOF'}`);
    }
    pos++;
    return tok;
  };

  function parseExpr() {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end of input');
    if (tok.type === 'STR') { consume('STR'); return Str(tok.value); }
    if (tok.type === '(') { consume('('); const inner = parseExpr(); consume(')'); return inner; }
    if (tok.type === 'IDENT') {
      const name = consume('IDENT').value;
      consume('(');
      const args = [];
      if (peek() && peek().type !== ')') {
        args.push(parseExpr());
        while (peek() && peek().type === ',') { consume(','); args.push(parseExpr()); }
      }
      consume(')');
      return App(name, args);
    }
    throw new Error(`Unexpected token "${tok.value}"`);
  }

  const ast = parseExpr();
  if (pos < tokens.length) throw new Error(`Trailing token "${tokens[pos].value}"`);
  return ast;
}

export function formatTerm(t) {
  if (t.type === 'Str') return `'${t.value}'`;
  if (t.type === 'App') return `${t.name}(${t.args.map(formatTerm).join(', ')})`;
  return '';
}

const tableAdd = (d1, d2) => Str(String(Number(d1) + Number(d2)));
const tableSub10 = (d) => Str(String(10 - Number(d)));
const tableMul = (d1, d2) => Str(String(Number(d1) * Number(d2)));
function tableSub(d1, d2) {
  const diff = Number(d1) - Number(d2);
  return diff >= 0 ? Str(String(diff)) : App('Neg', [Str(String(-diff))]);
}

function rewriteRoot(t) {
  if (isStr(t)) {
    if (t.value === '') return { term: Str('0'), rule: "'' -> '0'", channel: 0 };
    const norm = normalizeDigits(t.value);
    if (norm !== t.value) return { term: Str(norm), rule: `'${t.value}' -> '${norm}'`, channel: 0 };
    return null;
  }
  if (t.type !== 'App') return null;
  const { name, args } = t;

  if (name === 'Neg' && args.length === 1) {
    const [x] = args;
    if (isZero(x)) return { term: Str('0'), rule: "Neg('0') -> '0'", channel: 0 };
    if (isNeg(x)) return { term: x.args[0], rule: 'Neg(Neg(X)) -> X', channel: 0 };
    if (isRat(x)) return { term: App('Rat', [App('Neg', [x.args[0]]), x.args[1]]), rule: 'Neg(Rat(A,B)) -> Rat(Neg(A),B)', channel: 0 };
    return null;
  }
  if (name === 'Abs' && args.length === 1) {
    const [x] = args;
    if (isNormalizedStr(x)) return { term: x, rule: "Abs('s') -> 's'", channel: 0 };
    if (isNeg(x)) return { term: App('Abs', [x.args[0]]), rule: 'Abs(Neg(X)) -> Abs(X)', channel: 0 };
    return null;
  }
  if (name === 'Rat' && args.length === 2 && isStr(args[1]) && args[1].value === '1') {
    return { term: args[0], rule: "Rat(N, '1') -> N", channel: 0 };
  }
  if (name === 'Sub10' && args.length === 1 && isNonZeroDigit(args[0])) {
    return { term: tableSub10(args[0].value), rule: `Sub10('${args[0].value}')`, channel: 1 };
  }

  // ADDITION (Channel 1)
  if (name === 'Add' && args.length === 2) {
    const [a, b] = args;
    if (isZero(a)) return { term: b, rule: "Add('0', X) -> X", channel: 1 };
    if (isZero(b)) return { term: a, rule: "Add(X, '0') -> X", channel: 1 };
    if (isRat(a) && isRat(b)) {
      const [A, B] = a.args, [C, D] = b.args;
      return { term: App('Frac', [App('Add', [App('Mul', [A, D]), App('Mul', [B, C])]), App('Mul', [B, D])]), rule: 'Add(Rat, Rat)', channel: 2 };
    }
    if (!isRat(a) && isRat(b)) return { term: App('Add', [App('Rat', [a, Str('1')]), b]), rule: 'Add(X, Rat)', channel: 2 };
    if (isRat(a) && !isRat(b)) return { term: App('Add', [a, App('Rat', [b, Str('1')])]), rule: 'Add(Rat, Y)', channel: 2 };
    if (isNeg(a) && isNeg(b)) return { term: App('Neg', [App('Add', [a.args[0], b.args[0]])]), rule: 'Add(Neg(X), Neg(Y))', channel: 1 };
    if (isNeg(b)) return { term: App('Sub', [a, b.args[0]]), rule: 'Add(X, Neg(Y)) -> Sub(X, Y)', channel: 1 };
    if (isNeg(a)) return { term: App('Sub', [b, a.args[0]]), rule: 'Add(Neg(X), Y) -> Sub(Y, X)', channel: 1 };
    if (isNonZeroDigit(a) && isNonZeroDigit(b)) return { term: tableAdd(a.value, b.value), rule: `Add('${a.value}','${b.value}') [tbl]`, channel: 1 };
    if (isNonZeroDigit(a) && isMultiDigit(b)) {
      const [ys, y] = splitLast(b.value);
      if (y === '0') return { term: Str(ys + a.value), rule: "Add(d, ys:'0') -> 'ysd'", channel: 1 };
      return { term: App('Add', [Str(ys + '0'), App('Add', [a, Str(y)])]), rule: 'Add(d, ys:y)', channel: 1 };
    }
    if (isMultiDigit(a) && isNonZeroDigit(b)) {
      const [xs, x] = splitLast(a.value);
      if (x === '0') return { term: Str(xs + b.value), rule: "Add(xs:'0', d) -> 'xsd'", channel: 1 };
      return { term: App('Add', [Str(xs + '0'), App('Add', [Str(x), b])]), rule: 'Add(xs:x, d)', channel: 1 };
    }
    if (isMultiDigit(a) && isMultiDigit(b)) {
      const [xs, x] = splitLast(a.value), [ys, y] = splitLast(b.value);
      return { term: App('Add', [App('Mul', [App('Add', [Str(xs), Str(ys)]), Str('10')]), App('Add', [Str(x), Str(y)])]), rule: 'Add(xs:x, ys:y)', channel: 1 };
    }
    return null;
  }

  // SUBTRACTION (Channel 1)
  if (name === 'Sub' && args.length === 2) {
    const [a, b] = args;
    if (isZero(b)) return { term: a, rule: "Sub(X, '0') -> X", channel: 1 };
    if (isZero(a)) return { term: App('Neg', [b]), rule: "Sub('0', X) -> Neg(X)", channel: 1 };
    if (isRat(a) && isRat(b)) {
      const [A, B] = a.args, [C, D] = b.args;
      return { term: App('Frac', [App('Sub', [App('Mul', [A, D]), App('Mul', [B, C])]), App('Mul', [B, D])]), rule: 'Sub(Rat, Rat)', channel: 2 };
    }
    if (!isRat(a) && isRat(b)) return { term: App('Sub', [App('Rat', [a, Str('1')]), b]), rule: 'Sub(X, Rat)', channel: 2 };
    if (isRat(a) && !isRat(b)) return { term: App('Sub', [a, App('Rat', [b, Str('1')])]), rule: 'Sub(Rat, Y)', channel: 2 };
    if (isNeg(a) && isNeg(b)) return { term: App('Sub', [b.args[0], a.args[0]]), rule: 'Sub(Neg(X), Neg(Y))', channel: 1 };
    if (isNeg(b)) return { term: App('Add', [a, b.args[0]]), rule: 'Sub(X, Neg(Y)) -> Add(X, Y)', channel: 1 };
    if (isNeg(a)) return { term: App('Neg', [App('Add', [a.args[0], b])]), rule: 'Sub(Neg(X), Y)', channel: 1 };
    if (isSingleDigit(a) && isSingleDigit(b)) return { term: tableSub(a.value, b.value), rule: `Sub('${a.value}','${b.value}') [tbl]`, channel: 1 };
    if (isMultiDigit(a) && isNonZeroDigit(b)) {
      const [xs, x] = splitLast(a.value);
      if (x === '0') {
        return { term: App('Add', [App('Mul', [App('Sub', [Str(xs), Str('1')]), Str('10')]), tableSub10(b.value)]), rule: "Sub(xs:'0', d) [borrow]", channel: 1 };
      }
      return { term: App('Add', [Str(xs + '0'), App('Sub', [Str(x), b])]), rule: 'Sub(xs:x, d)', channel: 1 };
    }
    if (isNonZeroDigit(a) && isMultiDigit(b)) return { term: App('Neg', [App('Sub', [b, a])]), rule: 'Sub(d, ys:y) -> Neg(...)', channel: 1 };
    if (isMultiDigit(a) && isMultiDigit(b)) {
      const [xs, x] = splitLast(a.value), [ys, y] = splitLast(b.value);
      return { term: App('Add', [App('Mul', [App('Sub', [Str(xs), Str(ys)]), Str('10')]), App('Sub', [Str(x), Str(y)])]), rule: 'Sub(xs:x, ys:y)', channel: 1 };
    }
    return null;
  }

  // MULTIPLICATION (Channel 2)
  if (name === 'Mul' && args.length === 2) {
    const [a, b] = args;
    if (isZero(a) || isZero(b)) return { term: Str('0'), rule: "Mul(..., '0') -> '0'", channel: 2 };
    if (isRat(a) && isRat(b)) {
      const [A, B] = a.args, [C, D] = b.args;
      return { term: App('Frac', [App('Mul', [A, C]), App('Mul', [B, D])]), rule: 'Mul(Rat, Rat)', channel: 2 };
    }
    if (!isRat(a) && isRat(b)) return { term: App('Mul', [App('Rat', [a, Str('1')]), b]), rule: 'Mul(X, Rat)', channel: 2 };
    if (isRat(a) && !isRat(b)) return { term: App('Mul', [a, App('Rat', [b, Str('1')])]), rule: 'Mul(Rat, Y)', channel: 2 };
    if (isNeg(a) && isNeg(b)) return { term: App('Mul', [a.args[0], b.args[0]]), rule: 'Mul(Neg(X), Neg(Y))', channel: 2 };
    if (isNeg(b)) return { term: App('Neg', [App('Mul', [a, b.args[0]])]), rule: 'Mul(X, Neg(Y))', channel: 2 };
    if (isNeg(a)) return { term: App('Neg', [App('Mul', [a.args[0], b])]), rule: 'Mul(Neg(X), Y)', channel: 2 };
    if (isNormalizedStr(a) && !isZero(a) && isStr(b) && b.value === '10') return { term: Str(a.value + '0'), rule: "Mul('s','10') -> 's0'", channel: 2 };
    if (isNonZeroDigit(a) && isNonZeroDigit(b)) return { term: tableMul(a.value, b.value), rule: `Mul('${a.value}','${b.value}') [tbl]`, channel: 2 };
    if (isNonZeroDigit(a) && isMultiDigit(b)) {
      const [ys, y] = splitLast(b.value);
      if (y === '0') return { term: App('Mul', [App('Mul', [a, Str(ys)]), Str('10')]), rule: "Mul(d, ys:'0')", channel: 2 };
      return { term: App('Add', [App('Mul', [App('Mul', [a, Str(ys)]), Str('10')]), App('Mul', [a, Str(y)])]), rule: 'Mul(d, ys:y)', channel: 2 };
    }
    if (isMultiDigit(a)) {
      const [xs, x] = splitLast(a.value);
      if (x === '0') return { term: App('Mul', [App('Mul', [Str(xs), b]), Str('10')]), rule: "Mul(xs:'0', Y)", channel: 2 };
      return { term: App('Add', [App('Mul', [App('Mul', [Str(xs), b]), Str('10')]), App('Mul', [Str(x), b])]), rule: 'Mul(xs:x, Y)', channel: 2 };
    }
    return null;
  }

  // EUCLIDEAN DIVISION & GCD (Channel 3)
  if (name === 'IntDiv' && args.length === 2) {
    const [a, y] = args;
    if (isZero(a)) return { term: Str('0'), rule: "IntDiv('0', Y) -> '0'", channel: 3 };
    if (isNonZeroDigit(a)) return { term: App('DivDigit', [a, y]), rule: 'IntDiv(d, Y) -> DivDigit(d, Y)', channel: 3 };
    if (isMultiDigit(a)) {
      const [xs, x] = splitLast(a.value);
      return {
        term: App('Add', [App('Mul', [App('IntDiv', [Str(xs), y]), Str('10')]), App('DivDigit', [App('Add', [App('Mul', [App('IntMod', [Str(xs), y]), Str('10')]), Str(x)]), y])]),
        rule: 'IntDiv(xs:x, Y)',
        channel: 3,
      };
    }
    return null;
  }
  if (name === 'IntMod' && args.length === 2) {
    const [a, y] = args;
    if (isZero(a)) return { term: Str('0'), rule: "IntMod('0', Y) -> '0'", channel: 3 };
    if (isNonZeroDigit(a)) return { term: App('ModDigit', [a, y]), rule: 'IntMod(d, Y) -> ModDigit(d, Y)', channel: 3 };
    if (isMultiDigit(a)) {
      const [xs, x] = splitLast(a.value);
      return { term: App('ModDigit', [App('Add', [App('Mul', [App('IntMod', [Str(xs), y]), Str('10')]), Str(x)]), y]), rule: 'IntMod(xs:x, Y)', channel: 3 };
    }
    return null;
  }
  if (name === 'DivDigit' && args.length === 2) {
    return { term: App('DivStep', [App('Sub', [args[0], args[1]]), args[0], args[1]]), rule: 'DivDigit(R, Y) -> DivStep(Sub(R,Y), R, Y)', channel: 3 };
  }
  if (name === 'ModDigit' && args.length === 2) {
    return { term: App('ModStep', [App('Sub', [args[0], args[1]]), args[0], args[1]]), rule: 'ModDigit(R, Y) -> ModStep(Sub(R,Y), R, Y)', channel: 3 };
  }
  if (name === 'DivStep' && args.length === 3) {
    if (isNeg(args[0])) return { term: Str('0'), rule: "DivStep(Neg(Z), R, Y) -> '0'", channel: 3, isBaseHit: true };
    return { term: App('Add', [Str('1'), App('DivDigit', [args[0], args[2]])]), rule: "DivStep(R', R, Y) -> Add('1', DivDigit)", channel: 3 };
  }
  if (name === 'ModStep' && args.length === 3) {
    if (isNeg(args[0])) return { term: args[1], rule: 'ModStep(Neg(Z), R, Y) -> R', channel: 3, isBaseHit: true };
    return { term: App('ModDigit', [args[0], args[2]]), rule: "ModStep(R', R, Y) -> ModDigit", channel: 3 };
  }
  if (name === 'GCD' && args.length === 2) {
    if (isZero(args[1])) return { term: args[0], rule: "GCD(A, '0') -> A", channel: 3 };
    return { term: App('GCD', [args[1], App('IntMod', [args[0], args[1]])]), rule: 'GCD(A, B) -> GCD(B, IntMod(A,B))', channel: 3 };
  }

  // RATIONAL DIVISION & REDUCTION (Channel 3)
  if (name === 'Div' && args.length === 2) return { term: App('Frac', args), rule: 'Div(X, Y) -> Frac(X, Y)', channel: 3 };
  if (name === 'Frac' && args.length === 2) {
    const [n, d] = args;
    if (isRat(n)) return { term: App('Frac', [n.args[0], App('Mul', [n.args[1], d])]), rule: 'Frac(Rat(A,B), C)', channel: 3 };
    if (isRat(d)) return { term: App('Frac', [App('Mul', [n, d.args[1]]), d.args[0]]), rule: 'Frac(A, Rat(C,D))', channel: 3 };
    if (isZero(n)) return { term: Str('0'), rule: "Frac('0', D) -> '0'", channel: 3 };
    if (isNeg(d)) return { term: App('Frac', [App('Neg', [n]), d.args[0]]), rule: 'Frac(N, Neg(D))', channel: 3 };
    if (isStr(d) && d.value === '1') return { term: n, rule: "Frac(N, '1') -> N", channel: 3 };
    return { term: App('Reduce', [n, d, App('GCD', [App('Abs', [n]), d])]), rule: 'Frac(N, D) -> Reduce(N, D, GCD)', channel: 3 };
  }
  if (name === 'Reduce' && args.length === 3) {
    const [n, d, g] = args;
    if (isStr(g) && g.value === '1') return { term: App('Rat', [n, d]), rule: "Reduce(N, D, '1') -> Rat(N, D)", channel: 3 };
    if (isNeg(n)) return { term: App('Rat', [App('Neg', [App('IntDiv', [n.args[0], g])]), App('IntDiv', [d, g])]), rule: 'Reduce(Neg(N), D, G)', channel: 3 };
    return { term: App('Rat', [App('IntDiv', [n, g]), App('IntDiv', [d, g])]), rule: 'Reduce(N, D, G)', channel: 3 };
  }

  return null;
}

// Finds the exact AST object reference that stepTerm will rewrite next
export function findNextRedex(t) {
  if (t.type === 'App') {
    for (let i = 0; i < t.args.length; i++) {
      const sub = findNextRedex(t.args[i]);
      if (sub) return sub;
    }
  }
  return rewriteRoot(t) ? t : null;
}

export function stepTerm(t) {
  if (t.type === 'App') {
    for (let i = 0; i < t.args.length; i++) {
      const argStep = stepTerm(t.args[i]);
      if (argStep) {
        const nextArgs = t.args.slice();
        nextArgs[i] = argStep.term;
        return { term: App(t.name, nextArgs), rule: argStep.rule, channel: argStep.channel, isBaseHit: argStep.isBaseHit };
      }
    }
  }
  return rewriteRoot(t);
}

export function reduceTrace(input, maxSteps = 800) {
  let current = parseTerm(input);
  const trace = [];
  let step = 0;

  while (step < maxSteps) {
    const activeRedex = findNextRedex(current);
    const next = stepTerm(current);
    trace.push({
      step,
      term: current,
      str: formatTerm(current),
      activeRedex,
      rule: next ? next.rule : 'NORMAL_FORM',
      channel: next ? next.channel : 0,
      isBaseHit: Boolean(next?.isBaseHit),
    });
    if (!next) break;
    current = next.term;
    step++;
  }
  return { trace, finalTerm: current };
}

// ============================================================================
// TOKENIZES AST INTO <= 64 MEMORY CELLS FOR THE 8x8 TRIGGGER GRID
// ============================================================================
export function tokenizeTermForMatrix(term, activeRedex) {
  const cells = [];

  function walk(node, inRedex) {
    const isHit = inRedex || node === activeRedex;
    if (node.type === 'Str') {
      const chars = node.value === '' ? ['0'] : node.value.split('');
      chars.forEach((ch) => cells.push({ tok: ch, kind: 'digit', isRedex: isHit }));
      return;
    }
    if (node.type === 'App') {
      cells.push({ tok: node.name, kind: 'op', isRedex: isHit });
      cells.push({ tok: '(', kind: 'punct', isRedex: isHit });
      node.args.forEach((arg, idx) => {
        if (idx > 0) cells.push({ tok: ',', kind: 'punct', isRedex: isHit });
        walk(arg, isHit);
      });
      cells.push({ tok: ')', kind: 'punct', isRedex: isHit });
    }
  }

  walk(term, false);
  const totalLen = cells.length;
  const visible = cells.slice(0, 64);
  return { cells: visible, totalLen, overflow: Math.max(0, totalLen - 64) };
}

// ============================================================================
// BUILDS THE 4-STAGE SLIDE-AND-FEED TRACE ENDING AT '2025'
// ============================================================================
export function buildSlideAndFeedTimeline() {
  const stages = [
    {
      label: 'ACT 1 // SUBTRACTION & BORROW',
      sosPremise: "Sub(xs:'0', d) -> Add(Mul(Sub(xs,'1'),'10'), Sub10(d))",
      sosConclusion: 'SUBTRACTION NORM: <100 - 1> => 99',
      buildExpr: () => "Sub('100', '1')",
    },
    {
      label: 'ACT 1 // MULTIPLICATION EXPANSION',
      sosPremise: "Mul(xs:x, Y) -> Add(Mul(Mul(xs,Y),'10'), Mul(x,Y))",
      sosConclusion: 'SLIDE(99) + FEED(Mul(_, 5)) => 495',
      buildExpr: (prevStr) => `Mul(${prevStr}, '5')`,
    },
    {
      label: 'ACT 2 // EUCLIDEAN DIV & GCD REDUCTION',
      sosPremise: "DivStep(Sub(R,Y), R, Y) | Sub(R,Y)->Neg(Z) |- '0'",
      sosConclusion: 'SLIDE(495) + FEED(Div(_, 11)) => 45',
      buildExpr: (prevStr) => `Div(${prevStr}, '11')`,
    },
    {
      label: 'ACT 2 // SQUARE ACCUMULATOR',
      sosPremise: "Mul(xs:x, Y) -> Add(Mul(Mul(xs,Y),'10'), Mul(x,Y))",
      sosConclusion: 'SLIDE(45) + FEED(Mul(_, 45)) => 2025',
      buildExpr: (prevStr) => `Mul(${prevStr}, '45')`,
    },
    {
      label: 'ACT 2 // FINAL YEAR CONVERGENCE',
      sosPremise: 't ->* NF  |-  0 REDEXES REMAINING',
      sosConclusion: 'SLIDE(2025) + FEED(Add(_, 1)) => 2026',
      buildExpr: (prevStr) => `Add(${prevStr}, '1')`,
    },
  ];

  const timelineFrames = [];
  let prevResultStr = "'0'";

  stages.forEach((st, stageIdx) => {
    const expr = st.buildExpr(prevResultStr);
    const { trace, finalTerm } = reduceTrace(expr, 600);
    prevResultStr = formatTerm(finalTerm);

    const stride = trace.length > 45 ? Math.ceil(trace.length / 40) : 1;
    const sampled = trace.filter(
      (_, idx) => idx === 0 || idx === trace.length - 1 || idx % stride === 0
    );

    if (stageIdx > 0) {
      const first = sampled[0];
      timelineFrames.push({
        ...first,
        stageIdx,
        phase: 'SLIDE_FEED',
        label: `SLIDE_ACCUM(${formatTerm(parseTerm(expr).args[0])}) -> FEED(${parseTerm(expr).name})`,
        sosPremise: st.sosPremise,
        sosConclusion: st.sosConclusion,
        tokens: tokenizeTermForMatrix(first.term, null),
      });
    }

    sampled.forEach((item) => {
      timelineFrames.push({
        ...item,
        stageIdx,
        phase: 'REWRITE',
        label: st.label,
        sosPremise: st.sosPremise,
        sosConclusion: st.sosConclusion,
        tokens: tokenizeTermForMatrix(item.term, item.activeRedex),
      });
    });
  });

  return timelineFrames;
}