# KRYVEN ERA — GitHub + Vercel deployment

This project is arranged flat at the repository root. Keep `api/` as a single root-level folder beside the HTML files.

## GitHub
Upload all files in this folder to the **root of your GitHub repository** (do not put them inside another website folder).

## Vercel
Connect that GitHub repository to Vercel. Every push to the selected branch can then trigger a deployment.

Add these Vercel Environment Variables:

- `CASHFREE_CLIENT_ID` = your Cashfree Client/App ID
- `CASHFREE_CLIENT_SECRET` = your Cashfree Secret Key
- `CASHFREE_ENV` = `production` (use `sandbox` only while testing)
- `CASHFREE_API_VERSION` = `2025-01-01`
- `ADMIN_PIN` = your Admin panel PIN (**required**; the admin login is now checked on the server)
- `ADMIN_TOKEN_SECRET` = any long random string (optional)

Never commit a `.env` file; `.gitignore` already blocks it. See `.env.example`.

The Cashfree server functions are:

- `/api/create-order`
- `/api/status`
- `/api/webhook`
- `/api/admin-login`

Important: GitHub Pages alone cannot safely run the Cashfree server functions because the Secret Key must stay server-side. Use GitHub as the source repository and Vercel (or another server runtime) to deploy the `api/` functions.


## ERA Pass, sign-in, Spin the Era, and one-use rewards

These features use the Supabase project already configured in this storefront.

1. In Supabase Dashboard → SQL Editor, run `SUPABASE-ERA-REWARDS-SETUP.sql` once. It creates private membership/reward tables and the atomic coupon-reservation function.
2. In Supabase Authentication → Providers, enable Email authentication. Set the Site URL to your production domain and add your production URL plus `https://your-domain.com/**` to the Redirect URLs. If email confirmation is enabled, new customers must confirm the email before they can sign in.
3. In Vercel → Project → Settings → Environment Variables, add `SUPABASE_SERVICE_ROLE_KEY` using the service-role/secret key from the same Supabase project. Keep it server-only; never add this value to HTML or browser JavaScript. `SUPABASE_URL` and `SUPABASE_ANON_KEY` must match the Supabase project already used by the storefront. Changing projects also requires changing the existing public Supabase constants in the browser scripts. Redeploy after adding variables.
4. Keep the existing `SUPABASE_URL` / publishable browser key pointing at the same project that contains `kryven_store_state` and the orders table.
5. In Admin, configure products and current prices first. Then set eligible product IDs for every Spin the Era discount prize, follower coupons, and limited-drop gifts. The wheel remains unavailable until every discount prize has at least one valid selected product ID. Wheel discount prizes must be 25–50%; the ERA PASS prize must stay at exactly 0.50%; all wheel weights must total 100%.
6. The 30% next-order coupon is issued only for an order linked to the same account, marked Delivered, and with a verified successful payment. It is one-use and expires according to the Admin setting. Spin rewards reserved during checkout are released if payment fails, and can be retried after a 30-minute abandoned-checkout reservation window.

`SUPABASE_SERVICE_ROLE_KEY` is required for the new private tables. Without it (or if the SQL is not run), rewards, memberships and one-time coupon redemption will fail closed; do not launch paid traffic until the setup is complete and tested. A live Cashfree checkout cannot be validated from this ZIP alone—test one low-value order in the configured Cashfree environment after deployment.
