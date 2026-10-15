# FC Confessions v2 - Working Build (Next 15/16 Fix)

All previous issues FIXED.

## Fixed Issues

1. **Tailwind/PostCSS error**: Was using `tailwindcss` as PostCSS plugin directly (v4 breaking change). FIXED by:
   - package.json: `tailwindcss@4.1.5` + `@tailwindcss/postcss@4.1.5`
   - postcss.config.js now uses `@tailwindcss/postcss`

2. **Cross-origin dev resource block**: Next blocked 192.168.1.46. FIXED:
   - next.config.js added `allowedDevOrigins: ["192.168.1.46", "192.168.1.*", ...]`

3. **cookies() async crash**: In Next 15/16 App Router, `cookies()` is async. Old code `cookies().get` threw `TypeError: not a function`.
   - FIXED everywhere: `await cookies()` before .get/.set/.delete
   - Centralized in `lib/auth.ts`: `isAdminAuthenticated()`, `requireAdmin()`, `setAdminCookie()`, `clearAdminCookie()`

4. **Admin route crash**: Same cookies issue + missing error handling. FIXED.

5. **API route crash /api/admin-action**: Now exists with proper auth + Supabase + Telegram.

## Improvements in this build

- **No inline <script>**: Replaced with proper client component `components/AdminDashboardClient.tsx` with loading states + toast notifications
- **Security**: httpOnly, secure, sameSite=lax cookies, hidden admin route (noindex, not in sitemap/robots)
- **Error handling**: User-friendly messages, no raw 500
- **Pagination**: Filter by status (all/pending/approved/rejected)
- **Env validation**: Clear errors if env missing
- **Dark theme**: Via globals.css + layout.tsx

## Env Vars (set in .env.local AND Vercel)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_ADMIN_ID
PUBLIC_CHANNEL_ID
ADMIN_ROUTE=link.gauravasdimn2007
ADMIN_PASSWORD=...
```

## Run

```bash
npm install
npm run dev
```

## Deploy Vercel

1. Push to GitHub
2. Import to Vercel, add all env vars
3. Set webhook:
GET https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://YOUR_DOMAIN/api/telegram/webhook

## DB SQL (run first in Supabase)

Same as before - see previous README.

## Build Check

`npm run build` must pass. This build passes on Next 15.3.5 + React 19.
