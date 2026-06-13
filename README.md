# Tyna Systems Live Web App

Professional website + client dashboard + staff dashboard for Tyna Systems LLC.

The public website positions Tyna Systems as a Backend OS implementation company for Founders. The app layer includes email/password login, Google login-ready backend, user dashboard, staff dashboard, MongoDB models, product management, support messages, orders, bookings, contacts, and Paystack payment routes.

## Main folders

```text
frontend/   public pages, dashboard pages, CSS, browser JavaScript
backend/    Express API, MongoDB models, auth, staff, products, support, payments
database/   seed/reference data
docs/       deployment and app notes
```

## Install locally

```powershell
cd "C:\Users\USER\tynasystems"
npm install
npm run install:all
```

## Backend env

Create `backend/.env` from `backend/.env.example`.

```powershell
cd backend
copy .env.example .env
notepad .env
```

Required local values:

```env
PORT=5000
NODE_ENV=development
NODE_VERSION=20
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/tynasystems?retryWrites=true&w=majority
JWT_SECRET=generate_a_long_random_secret
STAFF_USERNAME=Tyna
STAFF_EMAIL=staff@tynasystems.com
STAFF_PASSWORD=Systems
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
PAYSTACK_SECRET_KEY=sk_test_replace_with_your_real_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_replace_with_your_real_public_key
PAYSTACK_CALLBACK_URL=http://localhost:5173/demo-checkout.html
```

Generate JWT secret:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Frontend API connection

Production frontend API calls are controlled by:

```text
frontend/assets/js/config.js
```

Current production backend URL:

```text
https://tynasystems-backend.onrender.com
```

For local Vite reference, see:

```text
frontend/.env.example
frontend/.env.local.example
frontend/.env.production.example
```

## Start backend and frontend separately

PowerShell 1:

```powershell
cd "C:\Users\USER\tynasystems\backend"
npm install
npm run dev
```

PowerShell 2:

```powershell
cd "C:\Users\USER\tynasystems\frontend"
npm install
npm run dev
```

Open frontend:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:5000/api/health
```

## Render backend settings

```text
Service Type: Web Service
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Important backend environment variables on Render:

```env
NODE_VERSION=20
NODE_ENV=production
CLIENT_URL=https://tynasystems-frontend.onrender.com
FRONTEND_URL=https://tynasystems-frontend.onrender.com
CORS_ORIGINS=https://tynasystems-frontend.onrender.com,http://localhost:5173,http://127.0.0.1:5173
PAYSTACK_CALLBACK_URL=https://tynasystems-frontend.onrender.com/demo-checkout.html
MONGODB_URI=your_real_mongodb_uri
JWT_SECRET=your_real_long_random_secret
PAYSTACK_SECRET_KEY=your_real_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_real_paystack_public_key
GOOGLE_CLIENT_ID=your_google_client_id
```

Do not set `PORT` on Render. Render injects it automatically.

## Render frontend settings

```text
Service Type: Static Site
Root Directory: frontend
Build Command: echo Static frontend ready
Publish Directory: .
```



Open `frontend/staff-login.html` or `/staff-login.html` in the deployed frontend.

Default staff credentials are:

- Username: `Tyna`
- Password: `Systems`

For live deployment, change `STAFF_USERNAME` and `STAFF_PASSWORD` in Render backend environment variables before going public.

## Notes

- Never push real `.env` files to GitHub.
- Never put `PAYSTACK_SECRET_KEY` in the frontend.
- Frontend can safely hold only the Paystack public key.
- Production file uploads should use persistent storage such as Cloudinary/S3 if needed.
