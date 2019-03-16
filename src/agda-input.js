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

// TODO Is it possible to disable running this hook in other modes?
CodeMirror.defineInitHook(function(cm) {
  cm.addKeyMap({
    "\\": function(cm) {
      cm.replaceSelection("\\");
      cm.execCommand("autocomplete");
    },
  });

  const cmplOpt = cm.getOption("hintOptions") || {};
  cmplOpt.extraKeys = {
    // Complete using space
    Space: function(cm) {
      const cA = cm.state.completionActive;
      if (cA) {
        cA.widget.pick();
        cm.replaceSelection(" ");
      }
    },
  };
  // Use custom `closeCharacters` to allow text with ()[]{};:>,
  // Note that this isn't documented.
  cmplOpt.closeCharacters = /[\s]/;
  // Disable auto completing even if there's only one choice.
  cmplOpt.completeSingle = false;
  cm.setOption("hintOptions", cmplOpt);
});

CodeMirror.registerGlobalHelper(
  "hint",
  "agda-input",
  // only enable in agda mode for now
  (mode, cm) => mode && mode.name === "agda",
  createHint(translations)
);
