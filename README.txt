KRYVEN ERA — CROSS-DEVICE ORDER BUILD

Upload the contents of this folder to the GitHub repository used by Vercel.

Customer orders are written directly to the Supabase `orders` table using the publishable browser key and the exact existing column names:
id, Customer name, Address, Product name, Customer number, Product price, Product size.

COD/card/bank orders are saved before the success UI is shown. UPI orders are also saved to the cloud before the UPI QR is displayed; payment verification itself requires a real gateway/backend.

Admin panel reads cloud orders every 5 seconds and can edit/delete cloud orders.

SUPABASE TABLE
- The HTML meta setting is the exact table name: Allow public order insert
- Both app.js and admin.js read this value from the HTML.
