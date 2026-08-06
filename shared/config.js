/* =====================================================================
   SCIM250 — shared configuration  (edit these values in ONE place)
   ---------------------------------------------------------------------
   SUPABASE_URL / SUPABASE_KEY  → your project URL + anon/publishable key
                                  (the publishable key is safe to ship;
                                   security comes from Row-Level Security)
   ALLOWED_DOMAINS              → the identity gate for students. Listing a
                                  base domain also admits every sub-domain
                                  of it, so "mahidol.ac.th" covers
                                  student.mahidol.ac.th, sc.mahidol.ac.th …
   ===================================================================== */
window.SCIM_CONFIG = {
  SUPABASE_URL:   "https://ngvjfpdpngicxisylgab.supabase.co",
  SUPABASE_KEY:   "sb_publishable_Z0BeoXxopNOW2PZHvO3gdg_EGTbGC9F",
  ALLOWED_DOMAINS: ["mahidol.ac.th", "mahidol.edu"]
};

/* True when the e-mail's domain is one of ALLOWED_DOMAINS or a sub-domain of
   one. Tolerates stray spaces, capitals and a trailing dot. Used by both the
   landing page and shared/auth-guard.js, so the rule lives in ONE place. */
window.SCIM_isAllowedEmail = function (email) {
  const clean = String(email || "").trim().toLowerCase().replace(/\.$/, "");
  const at = clean.lastIndexOf("@");
  if (at < 0) return false;
  const domain = clean.slice(at + 1);
  return (window.SCIM_CONFIG.ALLOWED_DOMAINS || []).some(function (d) {
    return domain === d || domain.endsWith("." + d);
  });
};
