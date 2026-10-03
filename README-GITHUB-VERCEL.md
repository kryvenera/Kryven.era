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

The Cashfree server functions are:

- `/api/create-order`
- `/api/status`
- `/api/webhook`

Important: GitHub Pages alone cannot safely run the Cashfree server functions because the Secret Key must stay server-side. Use GitHub as the source repository and Vercel (or another server runtime) to deploy the `api/` functions.
