# Diamond Inventory & Business Management Web Application
**Paladiya Brothers — Full Stack Project**

Stack: React (Vite) + Node.js/Express + MongoDB + JWT Auth

## Folder Structure
```
diamond-app/
  backend/    -> Node.js + Express + MongoDB API
  frontend/   -> React app (Vite)
```

## Features Implemented
- JWT Login/Register (Admin & Staff roles)
- Inventory module: Add/Edit/Delete/Search diamonds (carat, cut, color, clarity, shape, price, stock)
- Order module: Create orders, track payment & delivery status, auto stock deduction
- Dashboard: live stock value, total diamonds, orders, sales, collected amount
- **Customer module**: manage customer records, auto-linked when an order is placed, view per-customer order history
- **QR Code**: generate a scannable QR per diamond (encodes carat/cut/color/clarity/price) from the Inventory page
- **PDF & Excel export**: download a business summary PDF or full inventory Excel sheet from the Dashboard
- **Role-based access**: Admin can add/edit/delete everything and export reports. Staff can add/edit diamonds, customers, and orders, and update order status — but cannot delete records or export reports (buttons are hidden for Staff, and the backend also blocks these actions even if attempted directly).

---

## 1. RUN LOCALLY

### Backend
```
cd backend
npm install
cp .env.example .env
```
Edit `.env`:
```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<any random long string>
```
Then run:
```
npm run dev
```
Backend runs at `http://localhost:5000`

### Frontend
```
cd frontend
npm install
cp .env.example .env
```
`.env` already has `VITE_API_URL=http://localhost:5000/api` (correct for local dev).
```
npm run dev
```
Frontend runs at `http://localhost:3000`

### First Use
1. Open `http://localhost:3000/register` → create an Admin account.
2. Login → Dashboard shows up.
3. Go to Inventory → add some diamonds.
4. Go to Orders → create an order using added diamond.

---

## 2. GET FREE MONGODB DATABASE (MongoDB Atlas)
1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a free "M0" Cluster.
3. Database Access → Add a database user (username/password).
4. Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0).
5. Click "Connect" → "Drivers" → copy the connection string, looks like:
   `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/diamondDB?retryWrites=true&w=majority`
6. Paste this into backend `.env` as `MONGO_URI`.

---

## 3. DEPLOY LIVE (FREE)

### A) Push code to GitHub
```
cd diamond-app
git init
git add .
git commit -m "Diamond Inventory Management App"
git branch -M main
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```
(Create an empty repo first on github.com, then use that URL above.)

### B) Deploy Backend on Render (free)
1. Go to https://render.com → Sign up/login with GitHub.
2. New → Web Service → select your repo.
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `PORT` (10000 is fine, Render sets it automatically too).
7. Deploy. You'll get a live URL like `https://diamond-backend.onrender.com`

### C) Deploy Frontend on Vercel (free)
1. Go to https://vercel.com → Sign up/login with GitHub.
2. New Project → import your repo.
3. Root Directory: `frontend`
4. Framework Preset: Vite
5. Add Environment Variable: `VITE_API_URL` = `https://diamond-backend.onrender.com/api` (your Render backend URL + /api)
6. Deploy. You'll get a live URL like `https://diamond-paladiya.vercel.app`

Your app is now live! Share the Vercel URL with mentor/company.

### Note
Render free tier sleeps after inactivity — first request after idle may take 30-50 seconds to wake up. That's normal for free hosting.

---

## 4. Next Steps (matches your report's Week 12-17 plan)
- Add unit tests (Jest) for backend routes
- Add role-based UI restrictions (hide Delete buttons for "staff" role)
- Add PDF/Excel export for reports (use `pdfkit` or `exceljs` on backend)
- Add QR code generation per diamond (`qrcode` npm package) — matches your Future Scope section
