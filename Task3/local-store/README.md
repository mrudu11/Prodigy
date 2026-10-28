# Local Store E-commerce Platform
React (Vite) + Node/Express + MySQL

## Features
- Product listings with images, descriptions, prices
- Shopping cart (saved in the browser), checkout, stock check
- Optional features: order tracking, product reviews, customer support form, search, sort and filters

## Setup (VS Code)
1. Install Node.js (LTS) and MySQL. Open the `local-store` folder in VS Code.
2. Create the database: open MySQL Workbench (or run `mysql -u root -p < database/schema.sql`).
3. Backend: `server/.env` -> set DB_PASSWORD (and ADMIN_KEY).
   Terminal 1:
       cd server
       npm install
       npm run dev
4. Frontend. Terminal 2:
       cd client
       npm install
       npm run dev
5. Open http://localhost:5173

## Update an order's status (shop owner)
curl -X PUT http://localhost:5000/api/orders/1/status -H "Content-Type: application/json" -H "x-admin-key: change-me" -d '{"status":"Packed"}'
Statuses: Placed, Packed, Out for delivery, Delivered, Cancelled

## Add your own products
Edit the INSERT in database/schema.sql, or run INSERT statements in MySQL. Replace image_url with your own photos.
