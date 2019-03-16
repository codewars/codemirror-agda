(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('codemirror')) :
  typeof define === 'function' && define.amd ? define(['codemirror'], factory) :
  (global = global || self, factory(global.CodeMirror));
}(this, function (CodeMirror) { 'use strict';

  CodeMirror = CodeMirror && CodeMirror.hasOwnProperty('default') ? CodeMirror['default'] : CodeMirror;

  // Requires addon/mode/simple.js

  const floatRegex = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?=[.;{}()@"\s]|$)/u;
  const integerRegex = /-?(?:0|[1-9]\d*|0x[0-9A-Fa-f]+)(?=[.;{}()@"\s]|$)/u;

  const keywordsRegex = new RegExp(
    "(?:[_=|→:?\\\\λ∀]|->|\\.{2,3}|abstract|codata|coinductive|constructor|" +
      "data|do|eta-equality|field|forall|hiding|import|in|inductive|" +
      "infix|infixl|infixr|instance|let|macro|module|mutual|no-eta-equality|" +
      "open|overlap|pattern|postulate|primitive|private|public|quote|" +
      "quoteContext|quoteGoal|quoteTerm|record|renaming|rewrite|" +
      "syntax|tactic|unquote|unquoteDecl|unquoteDef|using|where|with|" +
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

  const hint = (cm, self, data) =>
    cm.replaceRange(data.symbol, self.from, self.to);

  const cmObj = (k, v) => ({
    text: "\\" + k,
    symbol: v,
    displayText: `${v} \\${k}`,
    hint: hint,
  });

  const toTable = pairs =>
    pairs.reduce((a, p) => {
      a.push.apply(
        a,
        Array.from(p[1].replace(/\s/g, "")).map(v => cmObj(p[0], v))
      );
      return a;
    }, []).sort((a,b) => a.text.localeCompare(b.text));

  // Subset of agda-input-translations + TeX-Input
  // TODO Add some more from TeX-Input
  // https://github.com/agda/agda/blob/master/src/data/emacs-mode/agda-input.el#L191
  const translations = toTable([
    ["ell", "ℓ"],
    // Equality and similar symbols.
    // ["eq", "=∼∽≈≋∻∾∿≀≃⋍≂≅ ≌≊≡≣≐≑≒≓≔≕≖≗≘≙≚≛≜≝≞≟≍≎≏≬⋕"],
    // ["eqn", "≠≁ ≉     ≄  ≇≆  ≢                 ≭    "],
    // ["=", "="],
    ["=n", "≠"],
    ["~", "∼"],
    ["~n", "≁"],
    ["~~", "≈"],
    ["~~n", "≉"],

    // ["~~~", "≋"],
    // [":~", "∻"],
    ["~-", "≃"],
    ["~-n", "≄"],
    ["-~", "≂"],
    ["~=", "≅"],
    ["~=n", "≇"],
    ["~~-", "≊"],
    ["==", "≡"],
    ["==n", "≢"],
    // ["===", "≣"],
    // [".=", "≐"],
    // [".=.", "≑"],
    // [":=", "≔"],
    // ["=:", "≕"],
    // ["=o", "≗"],
    // ["(=", "≘"],
    // ["and=", "≙"],
    // ["or=", "≚"],
    // ["*=", "≛"],
    // ["t=", "≜"],
    // ["def=", "≝"],
    // ["m=", "≞"],
    // ["?=", "≟"],

    // Inequality and similar symbols.
    //["leq", "<≪⋘≤≦≲ ≶≺≼≾⊂⊆ ⋐⊏⊑ ⊰⊲⊴⋖⋚⋜⋞"],
    //["leqn", "≮  ≰≨≴⋦≸⊀ ⋨⊄⊈⊊  ⋢⋤ ⋪⋬   ⋠"],
    //["geq", ">≫⋙≥≧≳ ≷≻≽≿⊃⊇ ⋑⊐⊒ ⊱⊳⊵⋗⋛⋝⋟"],
    //["geqn", "≯  ≱≩≵⋧≹⊁ ⋩⊅⊉⊋  ⋣⋥ ⋫⋭   ⋡"],
    ["<=", "≤"],
    [">=", "≥"],
    ["<=n", "≰"],
    [">=n", "≱"],
    ["le", "≤"],
    ["ge", "≥"],
    ["len", "≰"],
    ["gen", "≱"],
    ["<n", "≮"],
    [">n", "≯"],
    ["<~", "≲"],
    [">~", "≳"],
    // ["<~n", "⋦"],
    // [">~n", "⋧"],
    // ["<~nn", "≴"],
    // [">~nn", "≵"],
    ["sub", "⊂"],
    ["sup", "⊃"],
    ["subn", "⊄"],
    ["supn", "⊅"],
    ["sub=", "⊆"],
    ["sup=", "⊇"],
    ["sub=n", "⊈"],
    ["sup=n", "⊉"],
    // ["squb", "⊏"],
    // ["squp", "⊐"],
    // ["squb=", "⊑"],
    // ["squp=", "⊒"],
    // ["squb=n", "⋢"],
    // ["squp=n", "⋣"],

    // Set membership etc.
    // ["member", "∈∉∊∋∌∍⋲⋳⋴⋵⋶⋷⋸⋹⋺⋻⋼⋽⋾⋿"],
    ["in", "∈"],
    ["inn", "∉"],
    ["ni", "∋"],
    ["nin", "∌"],

    // Intersections, unions etc.
    // ["intersection", "∩⋂∧⋀⋏⨇⊓⨅⋒∏ ⊼      ⨉"],
    // ["union", "∪⋃∨⋁⋎⨈⊔⨆⋓∐⨿⊽⊻⊍⨃⊎⨄⊌∑⅀"],

    ["and", "∧"],
    ["or", "∨"],
    ["And", "⋀"],
    ["Or", "⋁"],
    // ["i", "∩"],
    // ["un", "∪"],
    // ["u+", "⊎"],
    // ["u.", "⊍"],
    // ["I", "⋂"],
    // ["Un", "⋃"],
    // ["U+", "⨄"],
    // ["U.", "⨃"],
    ["glb", "⊓"],
    ["lub", "⊔"],
    // ["Glb", "⨅"],
    // ["Lub", "⨆"],

    // Entailment etc.
    // ["entails", "⊢⊣⊤⊥⊦⊧⊨⊩⊪⊫⊬⊭⊮⊯"],
    ["|-", "⊢"],
    ["vdash", "⊢"],
    // ["|-n", "⊬"],
    // ["-|", "⊣"],
    // ["|=", "⊨"],
    // ["|=n", "⊭"],
    // ["||-", "⊩"],
    // ["||-n", "⊮"],
    // ["||=", "⊫"],
    // ["||=n", "⊯"],
    // ["|||-", "⊪"],

    // Divisibility, parallelity.
    ["|", "∣"],
    ["|n", "∤"],
    ["||", "∥"],
    ["||n", "∦"],

    // Some symbols from logic and set theory.
    ["all", "∀"],
    ["ex", "∃"],
    ["exn", "∄"],
    ["0", "∅"],
    ["C", "∁"],

    // Corners, ceilings and floors.
    // ["c", "⌜⌝⌞⌟⌈⌉⌊⌋"],
    // ["cu", "⌜⌝  ⌈⌉  "],
    // ["cl", "  ⌞⌟  ⌊⌋"],
    // ["cul", "⌜"],
    // ["cuL", "⌈"],
    // ["cur", "⌝"],
    // ["cuR", "⌉"],
    // ["cll", "⌞"],
    // ["clL", "⌊"],
    // ["clr", "⌟"],
    // ["clR", "⌋"],

    // Various operators/symbols.
    ["qed", "∎"],
    ["x", "×"],
    ["o", "∘"],
    ["comp", "∘"],
    [".", "∙"],
    ["*", "⋆"],
    // [".+", "∔"],
    // [".-", "∸"],
    // [":", "∶⦂ː꞉˸፥፦：﹕︓"],
    // [",", "ʻ،⸲⸴⹁⹉、︐︑﹐﹑，､"],
    // [";", "؛⁏፤꛶；︔﹔⍮⸵;"],
    ["::", "∷"],
    // ["::-", "∺"],
    // ["-:", "∹"],
    // ["+ ", "⊹"],
    // ["surd3", "∛"],
    // ["surd4", "∜"],
    // ["increment", "∆"],
    ["inf", "∞"],
    // ["&", "⅋"],
    ["top", "⊤"],
    ["bot", "⊥"],
    ["neg", "¬"],

    // Circled operators.
    // ["o+", "⊕"],
    // ["o--", "⊖"],
    // ["ox", "⊗"],
    // ["o/", "⊘"],
    // ["o.", "⊙"],
    // ["oo", "⊚"],
    // ["o*", "⊛"],
    // ["o=", "⊜"],
    // ["o-", "⊝"],
    // ["O+", "⨁"],
    // ["Ox", "⨂"],
    // ["O.", "⨀"],
    // ["O*", "⍟"],

    // Boxed operators.
    // ["b+", "⊞"],
    // ["b-", "⊟"],
    // ["bx", "⊠"],
    // ["b.", "⊡"],

    // Various symbols.
    // ["integral", "∫∬∭∮∯∰∱∲∳"],
    // ["angle", "∟∡∢⊾⊿"],
    // ["join", "⋈⋉⋊⋋⋌⨝⟕⟖⟗"],

    // Arrows.
    // ["l", "←⇐⇚⇇⇆↤⇦↞↼↽⇠⇺↜⇽⟵⟸↚⇍⇷ ↹     ↢↩↫⇋⇜⇤⟻⟽⤆↶↺⟲ "],
    // ["r", "→⇒⇛⇉⇄↦⇨↠⇀⇁⇢⇻↝⇾⟶⟹↛⇏⇸⇶ ↴    ↣↪↬⇌⇝⇥⟼⟾⤇↷↻⟳⇰⇴⟴⟿ ➵➸➙➔➛➜➝➞➟➠➡➢➣➤➧➨➩➪➫➬➭➮➯➱➲➳➺➻➼➽➾⊸"],
    // ["u", "↑⇑⟰⇈⇅↥⇧↟↿↾⇡⇞          ↰↱➦ ⇪⇫⇬⇭⇮⇯                                           "],
    // ["d", "↓⇓⟱⇊⇵↧⇩↡⇃⇂⇣⇟         ↵↲↳➥ ↯                                                "],
    // ["ud", "↕⇕   ↨⇳                                                                    "],
    // ["lr", "↔⇔         ⇼↭⇿⟷⟺↮⇎⇹                                                        "],
    // ["ul", "↖⇖                        ⇱↸                                               "],
    // ["ur", "↗⇗                                         ➶➹➚                             "],
    // ["dr", "↘⇘                        ⇲                ➴➷➘                             "],
    // ["dl", "↙⇙                                                                         "],
    ["l-", "←"],
    ["<-", "←"],
    ["l=", "⇐"],
    ["r-", "→"],
    ["->", "→"],
    ["r=", "⇒"],
    ["=>", "⇒"],
    // ["u-", "↑"], ["u=", "⇑"],
    // ["d-", "↓"], ["d=", "⇓"],
    // ["ud-", "↕"], ["ud=", "⇕"],
    ["lr-", "↔"],
    ["<->", "↔"],
    // ["lr=", "⇔"],
    ["<=>", "⇔"],
    // ["ul-", "↖"], ["ul=", "⇖"],
    // ["ur-", "↗"], ["ur=", "⇗"],
    // ["dr-", "↘"], ["dr=", "⇘"],
    // ["dl-", "↙"], ["dl=", "⇙"],

    // ["l==", "⇚"],
    // ["l-2", "⇇"],
    ["l-r-", "⇆"],
    // ["r==", "⇛"],
    // ["r-2", "⇉"],
    // ["r-3", "⇶"],
    // ["r-l-", "⇄"],
    // ["u==", "⟰"],
    // ["u-2", "⇈"],
    // ["u-d-", "⇅"],
    // ["d==", "⟱"],
    // ["d-2", "⇊"],
    // ["d-u-", "⇵"],

    // ["l--", "⟵"],
    // ["<--", "⟵"],
    // ["l~", "↜⇜"],
    // ["r--", "⟶"],
    // ["-->", "⟶"],
    // ["r~", "↝⇝⟿"],
    // ["lr--", "⟷"],
    // ["<-->", "⟷"],
    // ["lr~", "↭"],

    // ["l-n", "↚"],
    // ["<-n", "↚"],
    // ["l=n", "⇍"],
    // ["r-n", "↛"],
    // ["->n", "↛"],
    // ["r=n", "⇏"],
    // ["=>n", "⇏"],
    // ["lr-n", "↮"],
    // ["<->n", "↮"],
    // ["lr=n", "⇎"],
    // ["<=>n", "⇎"],

    // ["l-|", "↤"],
    // ["ll-", "↞"],
    ["r-|", "↦"],
    ["mapsto", "↦"],
    // ["rr-", "↠"],
    // ["u-|", "↥"],
    // ["uu-", "↟"],
    // ["d-|", "↧"],
    // ["dd-", "↡"],
    // ["ud-|", "↨"],

    // ["l->", "↢"],
    // ["r->", "↣"],

    // ["r-o", "⊸"],
    // ["-o", "⊸"],

    // ["dz", "↯"],

    // Ellipsis.
    ["...", "⋯⋮⋰⋱"],

    // Blackboard bold letters.
    ["bC", "ℂ"],
    ["bH", "ℍ"],
    ["bN", "ℕ"],
    ["bP", "ℙ"],
    ["bQ", "ℚ"],
    ["bR", "ℝ"],
    ["bZ", "ℤ"],

    // Parentheses.
    //["(", "([{⁅⁽₍〈⎴⟅⟦⟨⟪⦃〈《「『【〔〖〚︵︷︹︻︽︿﹁﹃﹙﹛﹝（［｛｢"],
    //[")", ")]}⁆⁾₎〉⎵⟆⟧⟩⟫⦄〉》」』】〕〗〛︶︸︺︼︾﹀﹂﹄﹚﹜﹞）］｝｣"],
    ["[[", "⟦"],
    ["]]", "⟧"],
    ["<", "⟨"],
    [">", "⟩"],
    ["<<", "⟪"],
    [">>", "⟫"],
    ["{{", "⦃"],
    ["}}", "⦄"],

    // ["(b", "⟅"],
    // [")b", "⟆"],
    // ["lbag", "⟅"],
    // ["rbag", "⟆"],
    // ["(|", "⦇"], // Idiom brackets
    // ["|)", "⦈"],
    // ["((", "⦅"], // Banana brackets
    // ["))", "⦆"],

    // Primes.
    ["'", "′″‴⁗"],
    ["'1", "′"],
    ["`", "‵‶‷"],

    // Fractions.
    // ["frac", "¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅟"],

    // Bullets.
    // ["bu", "•◦‣⁌⁍"],
    // ["bub", "•"],
    // ["buw", "◦"],
    // ["but", "‣"],

    // Musical symbols.
    // ["note", "♩♪♫♬"],
    ["b", "♭"],
    ["#", "♯"],

    // Other punctuation and symbols.
    ["\\", "\\"],
    // ["en", "–"],
    // ["em", "—"],
    // ["!!", "‼"],
    // ["??", "⁇"],
    // ["?!", "‽⁈"],
    // ["!?", "⁉"],

    // Shorter forms of many greek letters plus ƛ.
    ["Ga", "α"], ["GA", "Α"],
    ["Gb", "β"], ["GB", "Β"],
    ["Gg", "γ"], ["GG", "Γ"],
    ["Gd", "δ"], ["GD", "Δ"],
    ["Ge", "ε"], ["GE", "Ε"],
    ["Gz", "ζ"], ["GZ", "Ζ"],
    ["eta", "η"],
    ["Gth", "θ"], ["GTH", "Θ"],
    ["Gi", "ι"], ["GI", "Ι"],
    ["Gk", "κ"], ["GK", "Κ"],
    ["Gl", "λ"], ["GL", "Λ"], ["Gl-", "ƛ"],
    ["Gm", "μ"], ["GM", "Μ"],
    ["Gn", "ν"], ["GN", "Ν"],
    ["pi", "π"], ["Pi", "Π"],
    ["Gx", "ξ"], ["GX", "Ξ"],
    ["Gr", "ρ"], ["GR", "Ρ"],
    ["Gs", "σ"], ["GS", "Σ"],
    ["Gt", "τ"], ["GT", "Τ"],
    ["Gu", "υ"], ["GU", "Υ"],
    ["Gf", "φ"], ["GF", "Φ"],
    ["Gc", "χ"], ["GC", "Χ"],
    ["Gp", "ψ"], ["GP", "Ψ"],
    ["Go", "ω"], ["GO", "Ω"],

    // (Sub / Super) scripts
    ["_0", "₀"], ["_1", "₁"], ["_2", "₂"], ["_3", "₃"], ["_4", "₄"],
    ["_5", "₅"], ["_6", "₆"], ["_7", "₇"], ["_8", "₈"], ["_9", "₉"],

    ["_a", "ₐ"], ["_e", "ₑ"], ["_h", "ₕ"], ["_i", "ᵢ"], ["_j", "ⱼ"],
    ["_k", "ₖ"], ["_l", "ₗ"], ["_m", "ₘ"], ["_n", "ₙ"], ["_o", "ₒ"],
    ["_p", "ₚ"], ["_r", "ᵣ"], ["_s", "ₛ"], ["_t", "ₜ"], ["_u", "ᵤ"],
    ["_x", "ₓ"],

    ["^0", "⁰"], ["^1", "¹"], ["^2", "²"], ["^3", "³"], ["^4", "⁴"],
    ["^5", "⁵"], ["^6", "⁶"], ["^7", "⁷"], ["^8", "⁸"], ["^9", "⁹"],

    ["^a", "ᵃ"], ["^b", "ᵇ"], ["^c", "ᶜ"], ["^d", "ᵈ"], ["^e", "ᵉ"],
    ["^f", "ᶠ"], ["^g", "ᵍ"], ["^h", "ʰ"], ["^i", "ⁱ"], ["^j", "ʲ"],
    ["^k", "ᵏ"], ["^l", "ˡ"], ["^m", "ᵐ"], ["^n", "ⁿ"], ["^o", "ᵒ"],
    ["^p", "ᵖ"], ["^r", "ʳ"], ["^s", "ˢ"], ["^t", "ᵗ"], ["^u", "ᵘ"],
    ["^v", "ᵛ"], ["^w", "ʷ"], ["^x", "ˣ"], ["^y", "ʸ"], ["^z", "ᶻ"],

    ["^A", "ᴬ"], ["^B", "ᴮ"], ["^D", "ᴰ"], ["^E", "ᴱ"], ["^G", "ᴳ"],
    ["^H", "ᴴ"], ["^I", "ᴵ"], ["^J", "ᴶ"], ["^K", "ᴷ"], ["^L", "ᴸ"],
    ["^M", "ᴹ"], ["^N", "ᴺ"], ["^O", "ᴼ"], ["^P", "ᴾ"], ["^R", "ᴿ"],
    ["^T", "ᵀ"], ["^U", "ᵁ"], ["^V", "ⱽ"], ["^W", "ᵂ"],
  ]);

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

}));
