import CodeMirror from "codemirror";
// Requires addon/mode/simple.js

const floatRegex = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?=[.;{}()@"\s]|$)/u;
const integerRegex = /-?(?:0|[1-9]\d*|0x[0-9A-Fa-f]+)(?=[.;{}()@"\s]|$)/u;

const keywordsRegex = new RegExp(
  "(?:[_=|→:?\\\\λ∀]|->|\\.{2,3}|abstract|codata|coinductive|constructor|" +
    "data|do|eta-equality|field|forall|hiding|import|in|inductive|" +
    "infix|infixl|infixr|instance|let|macro|module|mutual|no-eta-equality|" +
    "open|overlap|pattern|postulate|primitive|private|public|quote|" +
    "quoteContext|quoteGoal|quoteTerm|record|renaming|rewrite|" +
    "syntax|tactic|to|unquote|unquoteDecl|unquoteDef|using|variable|where|with|" +
    'Set(?:\\d+|[₀₁₂₃₄₅₆₇₈₉]+)?)(?=[.;{}()@"\\s]|$)',
  "u"
);

const escapeDec = "0|[1-9]\\d*";
const escapeHex = "x(?:0|[1-9A-Fa-f][0-9A-Fa-f]*)";
const escapeCode =
  "[abtnvf&\\\\'\"]|NUL|SOH|STX|ETX|EOT|ENQ|ACK|BEL|BS|HT|LF|VT|FF|CR|" +
  "SO|SI|DLE|DC[1-4]|NAK|SYN|ETB|CAN|EM|SUB|ESC|FS|GS|RS|US|SP|DEL";
const escapeChar = new RegExp(
  "\\\\(?:" + escapeDec + "|" + escapeHex + "|" + escapeCode + ")",
  "u"
);

const startState = [
  // comments, pragmas, holes
  { regex: /\{-#.*?#-\}/u, token: "meta" },
  { regex: /\{-/u, token: "comment", push: "comment" },
  { regex: /\{!/u, token: "keyword", push: "hole" },
  { regex: /--.*/u, token: "comment" },

  // literals
  { regex: floatRegex, token: "number" },
  { regex: integerRegex, token: "integer" },
  { regex: /'/u, token: "string", push: "charLit" },
  { regex: /"/u, token: "string", push: "strLit" },

  // keywords & qualified names
  { regex: keywordsRegex, token: "keyword" },
  { regex: /[^\s.;{}()@"]+\./u, token: "qualifier" },
  { regex: /[^\s.;{}()@"]+/u, token: null },
  { regex: /./u, token: null },
];

const commentState = [
  { regex: /\{-/u, token: "comment", push: "comment" },
  { regex: /-\}/u, token: "comment", pop: true },
  { regex: /./u, token: "comment" },
];

const holeState = [
  { regex: /\{!/u, token: "keyword", push: "hole" },
  { regex: /!\}/u, token: "keyword", pop: true },
  { regex: /./u, token: "comment" },
];

const charLitState = [
  { regex: /'/u, token: "string error", pop: true },
  { regex: /[^'\\]/u, token: "string", next: "charLitEnd" },
  { regex: escapeChar, token: "string", next: "charLitEnd" },
  { regex: /./u, token: "string error" },
];

const charLitEndState = [
  { regex: /'/u, token: "string", pop: true },
  { regex: /./u, token: "string error" },
  { regex: /[^]/u, token: "string error", pop: true },
];

const stringState = [
  { regex: /"/u, token: "string", pop: true },
  { regex: /[^"\\]/u, token: "string" },
  { regex: escapeChar, token: "string" },
  { regex: /./u, token: "string error" },
];

CodeMirror.defineSimpleMode("agda", {
  start: startState,
  comment: commentState,
  hole: holeState,
  charLit: charLitState,
  charLitEnd: charLitEndState,
  strLit: stringState,
});
CodeMirror.defineMIME("text/x-agda", "agda");
