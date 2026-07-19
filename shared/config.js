/* =====================================================================
   SCIM250 — shared configuration  (edit these values in ONE place)
   ---------------------------------------------------------------------
   SUPABASE_URL / SUPABASE_KEY  → your project URL + anon/publishable key
                                  (the publishable key is safe to ship;
                                   security comes from Row-Level Security)
   ALLOWED_DOMAINS              → only e-mails ending in these domains may
                                  sign in — the identity gate for students
   ===================================================================== */
window.SCIM_CONFIG = {
  SUPABASE_URL:   "https://ngvjfpdpngicxisylgab.supabase.co",
  SUPABASE_KEY:   "sb_publishable_Z0BeoXxopNOW2PZHvO3gdg_EGTbGC9F",
  ALLOWED_DOMAINS: ["student.mahidol.ac.th", "mahidol.ac.th"]
};
