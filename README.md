# codemirror-agda

CodeMirror extension for editing Agda.

Provides a function `defineMode` to define `agda` mode, and an array `UNICODE_HELPER_PAIRS`.

- `defineMode(CodeMirror)`: Define `agda` mode and MIME `text/x-agda`.
- `UNICODE_HELPER_PAIRS` (`[seq: string, sym: string][]`): For entering Unicode characters with ASCII sequences using [@codewars/codemirror-unicode-helper](https://github.com/codewars/codemirror-unicode-helper). A subset of `agda-input-translations` in `agda-input.el`.

See <https://codewars.github.io/codemirror-agda/>.

## Usage

```javascript
import CodeMirror from "codemirror";
import "codemirror/addon/mode/simple"; // `defineSimpleMode`
import "codemirror/addon/hint/show-hint"; // optional
import { unicodeHelperWith } from "@codewars/codemirror-unicode-helper"; // optional

import { defineMode, UNICODE_HELPER_PAIRS } from "@codewars/codemirror-agda";

defineMode(CodeMirror);
// Optionally register unicode input helper.
// `show-hint` addon is required.
CodeMirror.registerGlobalHelper(
  "hint",
  "agda-input",
  // only enable in agda mode
  (mode, cm) => mode && mode.name === "agda",
  unicodeHelperWith(UNICODE_HELPER_PAIRS)
);
```

## Acknowledgments

Agda mode was contributed by [@Bubbler-4](https://github.com/Bubbler-4).
