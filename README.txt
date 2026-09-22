KRYVEN ERA — READY-TO-UPLOAD STOREFRONT

FILES
- index.html        Main storefront
- styles.css        Luxury black/silver/gold UI
- app.js            Store logic, bag, wishlist, checkout, 3D view, reviews, barcode search
- admin.html        Owner admin panel
- admin.js          Admin settings/catalog/orders/customer/review tools
- assets/design-reference.png  Generated visual reference

DEPLOY TO VERCEL
1. Upload the CONTENTS of this folder (not the outer folder) to your GitHub repository.
2. Make sure index.html is in the repository root.
3. Import/connect that GitHub repository in Vercel.
4. Vercel should detect the static site automatically.
5. Open /admin.html for the admin panel.

ADMIN
Default demo PIN: KRYVEN26
Change it from Website editor > Admin PIN.

IMPORTANT PRODUCTION NOTE
This is a front-end/static build. Data is stored in the browser localStorage, so admin orders/settings are local to that browser/device. A real multi-device store needs a backend/database plus server-side admin authentication and a payment gateway. The UI hooks are already structured so that backend integration can be added later.

PAYMENTS
COD / UPI / Credit-Debit Card / Net Banking can be toggled in Admin > Payments. Actual online collection requires payment-provider credentials and server-side verification.

BARCODE
The storefront search box accepts product barcodes. If the browser supports BarcodeDetector, the small barcode button can use the device camera; otherwise enter the barcode manually.

REVIEWS
Customer reviews are intended to unlock after an order is marked Delivered in admin. Customers can attach up to 4 photos.

HERO VIDEO
Replace the hero video URL in Admin > Website editor. A temporary sample video is included by URL so the landing page is not blank.
