import CodeMirror from "codemirror";
// Requires addon/hint/show-hint.js
// Based on https://github.com/ejgallego/CodeMirror-TeX-input

import { translations } from "./translations";

// Returns CodeMirror hint function.
// TODO Doesn't seem to work for some characters like `(`
const createHint = table => (editor, _options) => {
  const cur = editor.getCursor();
  const curPos = { line: cur.line, ch: cur.ch };
  const matchEnd = { line: cur.line, ch: cur.ch };
  // Match backwards from the cursor to the back slash.
  let match = "";
  while (curPos.ch >= 0) {
    --curPos.ch;
    match = editor.getRange(curPos, matchEnd);
    if (match[0] === "\\") break;
  }

  const matchStart = curPos;
  const insertFun = (cm, _self, data) =>
    cm.replaceRange(data.symbol, matchStart, matchEnd);

  const list = [];
  for (const obj of table) {
    if (obj.text.startsWith(match)) {
      obj.hint = insertFun;
      list.push(obj);
    }
  }

  return { list: list, from: matchStart, to: matchEnd };
};

// TODO Is it possible to disable running this hook in other modes?
CodeMirror.defineInitHook(function(cm) {
  let additionalKeyMap = {};
  let keys = [
    ["\\", "\\"],
    ["Shift-9", "("],
    ["Shift-0", ")"],
    ["Shift-[", "{"],
    ["Shift-]", "}"],
    ["[", "["],
    ["]", "]"],
    [";", ";"],
    ["Shift-;", ":"],
    [",", ","],
    ["Shift-.", ">"]
  ];
  for (let [keyStroke, ch] of keys) {
    additionalKeyMap[keyStroke] = function(cm) {
      cm.replaceSelection(ch);
      cm.execCommand("autocomplete");
    };
  }
  cm.addKeyMap(additionalKeyMap);

  const cmplOpt = cm.getOption("hintOptions") || {};
  cmplOpt["extraKeys"] = {
    // Complete using space
    Space: function(cm) {
      const cA = cm.state.completionActive;
      if (cA) {
        cA.widget.pick();
        cm.replaceSelection(" ");
      }
    },
  };
  cmplOpt["completeSingle"] = false;
  cm.setOption("hintOptions", cmplOpt);
});

CodeMirror.registerGlobalHelper(
  "hint",
  "agda-input",
  // only enable in agda mode for now
  (mode, cm) => mode && mode.name === "agda",
  createHint(translations)
);
