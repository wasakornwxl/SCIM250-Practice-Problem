/* =====================================================================
   SCIM250 — "your last submission" panel
   ---------------------------------------------------------------------
   Every week page already writes the student's source to attempts.code on
   every run. Nothing ever read it back, so closing the tab lost the work.
   This reads it back.

   Which submission is shown, per problem:
       the latest PASSING attempt, if there is one
       otherwise the latest attempt of any kind

   so a student who solved a problem and then broke it still sees the
   version that worked. The panel says which of the two it is showing.

   Usage:
       await SCIMLastSub.load(supa, student.id, flatProblems.map(p => p.id));
       SCIMLastSub.mount("lastSub", problem, editor);     // in selectProblem
       SCIMLastSub.record(problem.id, {...});             // after an attempt
   ===================================================================== */
(function (global) {
  "use strict";

  var PAGE = 1000;              // PostgREST caps a response at this silently
  var byProblem = Object.create(null);

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function when(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
           " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  /* ---- fetch this page's attempts for this student ------------------ */

  function load(supa, userId, problemIds) {
    byProblem = Object.create(null);
    if (!supa || !userId || !problemIds || !problemIds.length) {
      return Promise.resolve(byProblem);
    }
    var rows = [];

    function page(from) {
      return supa
        .from("attempts")
        .select("problem_id,passed,score,total_tests,code,created_at")
        .eq("user_id", userId)
        .in("problem_id", problemIds)          // exact: "w1%" would also match w10
        .order("id", { ascending: true })      // deterministic paging
        .range(from, from + PAGE - 1)
        .then(function (res) {
          if (res.error) throw res.error;
          rows = rows.concat(res.data);
          if (res.data.length === PAGE) return page(from + PAGE);
          return rows;
        });
    }

    return page(0).then(function (all) {
      // ascending, so the last write of each slot wins
      all.forEach(function (r) {
        if (!r.problem_id) return;
        var slot = byProblem[r.problem_id] ||
                   (byProblem[r.problem_id] = { latest: null, lastPass: null });
        slot.latest = r;
        if (r.passed) slot.lastPass = r;
      });
      return byProblem;
    }).catch(function (e) {
      // never block the page over this — the week still works without it
      console.warn("last-submission: load failed", e);
      return byProblem;
    });
  }

  /* ---- keep the panel honest after a fresh run ---------------------- */

  function record(problemId, attempt) {
    if (!problemId) return;
    var slot = byProblem[problemId] ||
               (byProblem[problemId] = { latest: null, lastPass: null });
    var row = {
      problem_id: problemId,
      passed: !!attempt.passed,
      score: attempt.score,
      total_tests: attempt.total,
      code: attempt.code,
      created_at: new Date().toISOString()
    };
    slot.latest = row;
    if (row.passed) slot.lastPass = row;
  }

  function pick(problemId) {
    var slot = byProblem[problemId];
    if (!slot) return null;
    var row = slot.lastPass || slot.latest;
    if (!row || !row.code) return null;
    return { row: row, isPass: !!slot.lastPass };
  }

  /* ---- render ------------------------------------------------------- */

  function mount(containerId, problem, editor) {
    var host = document.getElementById(containerId);
    if (!host) return;
    var found = pick(problem.id);
    if (!found) { host.innerHTML = ""; return; }

    var r = found.row;
    var label = found.isPass ? "Your passing answer" : "Your last attempt";
    var score = found.isPass
      ? "passed"
      : (r.score === null || r.score === undefined || !r.total_tests
          ? "not passed"
          : r.score + "/" + r.total_tests + " tests");

    host.innerHTML =
      '<details class="lastsub">' +
        '<summary>' +
          '<span class="ls-label">' + esc(label) + '</span>' +
          '<span class="ls-meta">' + esc(score) +
            (when(r.created_at) ? " · " + esc(when(r.created_at)) : "") +
          '</span>' +
        '</summary>' +
        '<div class="ls-body">' +
          '<pre class="ls-code">' + esc(r.code) + '</pre>' +
          '<div class="ls-actions">' +
            '<button type="button" class="ls-copy">Copy into editor</button>' +
            '<span class="ls-note">' +
              (found.isPass
                ? "This is the version that passed."
                : "This did not pass — open it and see what changed.") +
            '</span>' +
          '</div>' +
        '</div>' +
      '</details>';

    var btn = host.querySelector(".ls-copy");
    if (btn && editor) {
      btn.addEventListener("click", function () {
        editor.setValue(r.code);
        editor.focus();
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy into editor"; }, 1400);
      });
    }
  }

  global.SCIMLastSub = { load: load, mount: mount, record: record, pick: pick };
})(window);
