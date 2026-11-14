# PHOTOBOOTH STUDIO — Phase 1 (Foundation)

Requires Node.js 18.18+ (20 LTS recommended).

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm start
```

Phase 2 adds the camera at /studio. Run `npm run check` to lint, typecheck, test and build in one go.

Next.js 14 (App Router), TypeScript, Tailwind CSS 3, Framer Motion. Fonts (Bricolage Grotesque, DM Sans) load via next/font at build time, so the first build needs internet.
All data lives in `src/lib/data.ts`. No Supabase or payments yet (Phases 6-8).

## Accounts, membership, manual payment, admin

1. **Supabase**: SQL Editor, run `supabase/migrations/001_init.sql`, then `002_manual_payment.sql` (in that order). In Storage you should see a private bucket `payment-proofs`. Auth -> URL Configuration: set Site URL and add `/auth/callback` to Redirect URLs.
2. **Env**: copy `.env.example` to `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` is a server-only secret. Never commit it.
3. **Payment accounts**: edit `src/lib/payment-accounts.ts`.
4. **Admin**: register, then run `update public.profiles set role = 'admin' where email = 'you@example.com';`
5. Flow: customer picks a plan, transfers the exact amount, uploads proof. You open `/admin`, check your real account balance, then Approve or Reject.
6. **WhatsApp alert (optional)**: add the CallMeBot contact (current number on callmebot.com), send it "I allow callmebot to send me messages" from WhatsApp, wait for the API key, then set `OWNER_WHATSAPP` and `CALLMEBOT_APIKEY` in `.env.local` and in Vercel.
