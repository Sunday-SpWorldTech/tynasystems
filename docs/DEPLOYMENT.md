# Deployment

## Backend
Deploy `backend` to Render, Railway, Azure App Service, or any Node.js host. Set environment variables from `backend/.env.example`.

## Frontend
Deploy `frontend` to Vercel/Netlify or serve it from the backend. The backend is already configured to serve the `frontend` folder when started in production.

## Paystack
Use live keys only after Paystack account verification. Set `PAYSTACK_CALLBACK_URL` to your live domain, for example `https://yourdomain.com/demo-checkout.html`.
