/* =====================================================================
   SCIM 250 — editor autocomplete
   ---------------------------------------------------------------------
   Two completion sources, deliberately no third:

     1. words already in the student's own buffer  (long variable names:
        records, group_col, value_col, sunshine_hr, …)
     2. a small fixed list of Python keywords + built-in functions

   There is NO pandas/numpy method completion, and the popup never opens
   after a "." — see NOTE below.

   Usage, right after CodeMirror.fromTextArea(...):
       SCIMHints.attach(editor, current);        // Python weeks
       SCIMHints.attach(editor, current, "sql"); // Weeks 09/10
   ===================================================================== */
(function (global) {
  "use strict";

  /* ---- source 2: fixed vocabulary --------------------------------- */

  var PY_WORDS = [
    // keywords a first-year writes
    "def", "return", "for", "in", "if", "elif", "else", "while",
    "import", "from", "as", "and", "or", "not", "lambda", "pass",
    "True", "False", "None",
    // built-in functions
    "abs", "bool", "dict", "enumerate", "float", "int", "len", "list",
    "max", "min", "print", "range", "round", "set", "sorted", "str",
    "sum", "tuple", "type", "zip"
  ];

  var SQL_WORDS = [
    "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT",
    "JOIN", "LEFT JOIN", "INNER JOIN", "ON", "AS", "AND", "OR", "NOT",
    "IN", "LIKE", "BETWEEN", "IS NULL", "IS NOT NULL", "DISTINCT",
    "COUNT", "SUM", "AVG", "MIN", "MAX", "ROUND", "CASE", "WHEN",
    "THEN", "ELSE", "END", "ASC", "DESC"
  ];

  /* ---- source 1: identifiers already in the buffer ------------------ */

  function bufferWords(cm) {
    var seen = Object.create(null);
    var out = [];
    var text = cm.getValue();
    var re = /[A-Za-z_][A-Za-z0-9_]*/g;
    var m;
    while ((m = re.exec(text))) {
      if (m[0].length >= 3 && !seen[m[0]]) { seen[m[0]] = 1; out.push(m[0]); }
    }
    return out;
  }

  /* ---- the hint function ------------------------------------------- */

  function makeHinter(problem, vocab) {
    return function (cm) {
      var cur = cm.getCursor();
      var line = cm.getLine(cur.line);

      // walk back over word characters to find what is being typed
      var start = cur.ch;
      while (start && /[A-Za-z0-9_]/.test(line.charAt(start - 1))) start--;
      var word = line.slice(start, cur.ch);
      if (word.length < 2) return null;

      // NOTE: never complete a method. Offering ".median()" on the
      // median problem, or ".idxmax()" on the challenge, hands over the
      // answer. Attribute access is out of scope for this feature.
      if (start > 0 && line.charAt(start - 1) === ".") return null;

      // don't fire inside a string or a comment
      var tokType = cm.getTokenTypeAt(cur) || "";
      if (/string|comment/.test(tokType)) return null;

      var lower = word.toLowerCase();
      var pick = function (list) {
        return list.filter(function (w) {
          return w.toLowerCase().lastIndexOf(lower, 0) === 0 && w !== word;
        });
      };

      // buffer identifiers rank above vocabulary
      var list = pick(bufferWords(cm)).concat(pick(vocab));

      // dedupe, preserving order
      var seen = Object.create(null);
      list = list.filter(function (w) {
        if (seen[w]) return false;
        seen[w] = 1;
        return true;
      });

      // never suggest a token this problem forbids — the grader would
      // reject it with "must be solved without: …"
      var banned = (problem && problem.banned) || [];
      if (banned.length) {
        list = list.filter(function (w) {
          return !banned.some(function (b) {
            var esc = b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return new RegExp("\\b" + esc + "\\b").test(w);
          });
        });
      }

      if (!list.length) return null;
      return {
        list: list.slice(0, 12),
        from: CodeMirror.Pos(cur.line, start),
        to: CodeMirror.Pos(cur.line, cur.ch)
      };
    };
  }

  /* ---- public entry point ------------------------------------------ */

  function attach(cm, problem, lang) {
    var vocab = lang === "sql" ? SQL_WORDS : PY_WORDS;
    var hint = makeHinter(problem, vocab);

    var opts = {
      hint: hint,
      // never auto-insert on a single match: a beginner cannot tell the
      // difference between "the editor typed that" and "I typed that"
      completeSingle: false,
      alignWithWord: true,
      closeOnUnfocus: true
    };

    // as-you-type
    cm.on("inputRead", function (_cm, change) {
      if (change.origin !== "+input") return;
      if (!/[A-Za-z0-9_]$/.test(change.text.join(""))) return;
      cm.showHint(opts);
    });

    // manual trigger
    cm.setOption("extraKeys", Object.assign({}, cm.getOption("extraKeys"), {
      "Ctrl-Space": function (c) { c.showHint(opts); }
    }));
  }

  global.SCIMHints = { attach: attach, PY_WORDS: PY_WORDS, SQL_WORDS: SQL_WORDS };
})(window);
