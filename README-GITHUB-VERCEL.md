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


## Final checkout fix
- Cashfree SDK is lazy-loaded on checkout action; it no longer blocks checkout.html from rendering.
- Customer details persist in localStorage key `kryven-era-customer-profile-v1` and are shared by COD and Cashfree choices.
- Checkout/customer pages are not rebuilt by the 10-second live catalog refresh while the user is interacting.
- Cashfree serverless functions are in the single root-level `api/` folder.
