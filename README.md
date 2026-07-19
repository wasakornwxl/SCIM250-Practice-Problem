# SCIM250 Practice Site

A static site (no server code) that gates the weekly Python practice sets behind
**Sign in with Google**, restricted to Mahidol accounts, and saves every attempt
to Supabase.

## Structure

```
scim250-site/            → deploy this folder's contents to GitHub Pages
├── index.html           Landing page: the ONLY sign-in screen + week menu
├── shared/
│   ├── config.js        Supabase URL/key + ALLOWED_DOMAINS  (edit here once)
│   └── auth-guard.js     Included by every week page; redirects if not signed in
└── weeks/
    └── week01.html       A guarded practice page (no sign-in UI of its own)
```

## How sign-in flows

1. Student opens `index.html`, clicks **Sign in with Google**, picks their Mahidol account.
2. The session is stored by the browser for this whole site (same origin), so every
   week page sees them as signed in — no second login.
3. Each `weeks/weekNN.html` runs `shared/auth-guard.js`, which:
   - lets a valid Mahidol session through (hands the page `{ supa, student }`), or
   - redirects back to `index.html` if there's no session / wrong domain.
4. Security is enforced in the database by **Row-Level Security** — a student can only
   read/write their own rows. The redirect is only for navigation.

## Run locally (for testing)

Google OAuth needs http(s), not `file://`. From this folder:

```
python -m http.server 5500
```

Open http://localhost:5500/ and sign in.
First add `http://localhost:5500` to **Supabase → Authentication → URL Configuration →
Redirect URLs**.

## Add another week

1. Copy `weeks/week01.html` to `weeks/week02.html`.
2. Replace the `LEVELS` array and the header title with that week's content.
3. In `index.html`, set that week's `available:true` in the `WEEKS` list.

Nothing about auth changes — the two `<script>` includes at the top do all of it.

## Deploy to GitHub Pages

1. Create a repo (e.g. `scim250`) and upload the **contents** of this folder.
2. Settings → Pages → deploy from `main`.
3. Add the resulting `https://<you>.github.io/<repo>/` URL to Supabase Redirect URLs.

See `../SCIM250_Auth_Plan.md` for the full one-time Supabase + Google setup.
