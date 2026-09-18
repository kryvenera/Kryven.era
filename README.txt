KRYVEN ERA UPDATED WEBSITE

Replace the old files in the same GitHub repository with these files.

Admin:
Open /admin.html. Default password: CHANGE-ME-1234
Change it in config.js before publishing.

WhatsApp:
Set your full Indian number in Admin or config.js, e.g. 9198XXXXXXXX (no +).

Orders:
Checkout saves orders in the browser and gives Send Order on WhatsApp and Send Order by Email buttons.
Automatic server-side email delivery still needs an email/backend service.

Admin editing:
Product title, description, price, photo URLs, sizes, colours and WhatsApp/email settings can be changed from the admin page.
This browser-only admin uses localStorage; it is not a secure cross-device database. A real private admin system needs a backend/database.

Do not delete the Vercel project. Commit these files to the same connected GitHub repository so Vercel redeploys the existing project.
