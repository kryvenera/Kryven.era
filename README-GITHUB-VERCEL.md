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
