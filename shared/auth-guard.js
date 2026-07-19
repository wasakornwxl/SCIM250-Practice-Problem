/* =====================================================================
   SCIM250 — auth guard  (included by every week/practice page)
   ---------------------------------------------------------------------
   Requires, loaded BEFORE this file:
     1. <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     2. <script src="../shared/config.js"></script>

   Behaviour:
     • builds the Supabase client from SCIM_CONFIG
     • checks for a signed-in session (shared across all pages on this origin)
     • no session            → redirect to the landing page to sign in
     • wrong e-mail domain   → sign out, then redirect to the landing page
     • valid Mahidol session → resolves SCIM_AUTH.ready with { supa, student }

   A page uses it like:
     const { supa, student } = await SCIM_AUTH.ready;
   ===================================================================== */
(function () {
  const cfg = window.SCIM_CONFIG || {};
  // week pages live in /weeks/, so the landing page is one level up.
  // Override by setting  window.SCIM_LANDING_PATH  before this script if needed.
  const LANDING = window.SCIM_LANDING_PATH || "../index.html";

  function goToLanding() {
    // remember where the student wanted to go, so we could bounce back later
    try { sessionStorage.setItem("scim_return", location.href); } catch (e) {}
    location.replace(LANDING);
  }

  window.SCIM_AUTH = {
    ready: new Promise(function (resolve) {
      if (!cfg.SUPABASE_URL || !cfg.SUPABASE_KEY || !window.supabase) {
        console.error("SCIM: missing Supabase config or supabase-js was not loaded.");
        goToLanding();
        return;
      }
      const supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);

      supa.auth.getSession().then(function (res) {
        const session = res.data.session;
        if (!session || !session.user) { goToLanding(); return; }

        const email = (session.user.email || "").toLowerCase();
        const ok = (cfg.ALLOWED_DOMAINS || []).some(function (d) {
          return email.endsWith("@" + d);
        });
        if (!ok) { supa.auth.signOut().finally(goToLanding); return; }

        const u = session.user;
        const student = {
          id:    u.id,
          email: email,
          name:  u.user_metadata.full_name || u.user_metadata.name || email
        };
        resolve({ supa: supa, student: student });
      });
    })
  };
})();
