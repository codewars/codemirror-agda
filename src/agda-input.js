import CodeMirror from "codemirror";
// Requires addon/hint/show-hint.js
// Based on https://github.com/ejgallego/CodeMirror-TeX-input

import { translations } from "./translations";

// Returns CodeMirror hint function.
const createHint = table => (editor, _options) => {
  const to = editor.getCursor();
  const str = editor.getLine(to.line).slice(0, to.ch);
  const from = { line: to.line, ch: str.lastIndexOf("\\") };

  const combo = editor.getRange(from, to);
  const list = table.filter(o => o.text.startsWith(combo));
  return { list: list, from: from, to: to };
};

CodeMirror.registerGlobalHelper(
  "hint",
  "agda-input",
  // only enable in agda mode for now
  (mode, cm) => mode && mode.name === "agda",
  createHint(translations)
);
