# KRYVEN ERA — GitHub + Vercel deployment

This archive is prepared for a GitHub-root + Vercel deployment.

## Repository structure

The website files must live directly in the repository root. The only server-function folder is the root-level `api/` folder.

```text
index.html
shop.html
product.html
checkout.html
payment.html
app.js
styles.css
...
api/
  create-order.js
  status.js
  webhook.js
  health.js
package.json
```

Do not put these files inside another KRYVEN-ERA folder.

## GitHub

Extract the ZIP and upload the extracted CONTENTS to the root of the GitHub repository. GitHub does not automatically turn an uploaded `.zip` file into website files, so do not upload the ZIP as the deployed source.

## Vercel

Connect the GitHub repository to Vercel. Keep the Vercel Root Directory at the repository root/default location so Vercel can see `api/` beside the HTML files.

Add these Environment Variables in Vercel:

- `CASHFREE_CLIENT_ID` = your Cashfree Client/App ID
- `CASHFREE_CLIENT_SECRET` = your Cashfree Secret Key
- `CASHFREE_ENV` = `production`
- `CASHFREE_API_VERSION` = `2025-01-01`

The Cashfree server functions are:

- `/api/create-order`
- `/api/status`
- `/api/webhook`

## Deployment check

After deployment open:

`https://YOUR-DOMAIN.vercel.app/api/health`

Expected response:

`{"ok":true,"service":"kryven-era-api"}`

Then open:

`https://YOUR-DOMAIN.vercel.app/api/create-order`

A GET request should return HTTP 405 / `Method not allowed`. That confirms the function is deployed; the payment page calls it with POST.

Never place the Cashfree Secret Key in frontend HTML/JavaScript or GitHub. Keep it only in Vercel Environment Variables.
