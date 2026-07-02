# Render Connection Notes

This update connects the static frontend to the backend API without changing page design/content.

## Backend Web Service

Recommended settings:

- Service Type: Web Service
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Runtime: Node

Required environment variables:

```env
NODE_VERSION=20
NODE_ENV=production
CLIENT_URL=https://tynasystems-frontend.onrender.com
FRONTEND_URL=https://tynasystems-frontend.onrender.com
CORS_ORIGINS=https://tynasystems-frontend.onrender.com,http://localhost:5173,http://127.0.0.1:5173
PAYSTACK_CALLBACK_URL=https://tynasystems-frontend.onrender.com/demo-checkout.html
MONGODB_URI=your_real_mongodb_uri
JWT_SECRET=your_long_random_secret
PAYSTACK_SECRET_KEY=your_real_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_real_paystack_public_key
GOOGLE_CLIENT_ID=sample_google_client_id.apps.googleusercontent.com
```

Do not set `PORT` on Render. Render injects it automatically.

## Frontend Static Site

Recommended settings:

- Service Type: Static Site
- Root Directory: `frontend`
- Build Command: `echo Static frontend ready`
- Publish Directory: `.`

The production backend API URL is controlled by:

```txt
frontend/assets/js/config.js
```

Current production backend API URL:

```txt
https://tynasystems-backend.onrender.com
```

## Notes

- `frontend/.env.example` is for local/reference use only.
- With the current static deployment, `.env` values are not read by the browser at runtime.
- Backend CORS accepts `CLIENT_URL`, `FRONTEND_URL`, and comma-separated `CORS_ORIGINS`.
- Root `postinstall` installs backend dependencies if Render is accidentally deployed from repository root.

