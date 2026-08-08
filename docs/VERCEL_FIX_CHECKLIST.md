# Tyna Systems Vercel production checklist

The application code is configured to use same-origin `/api/*` routes on Vercel. Do not replace those browser requests with an old Render URL.

## Required Vercel Environment Variables

Add the real values from your private local `backend/.env` to the Vercel project settings. The `.env` file is intentionally ignored by Git and therefore is **not** sent to GitHub/Vercel automatically.

Minimum required for login:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL=https://tynasystems.com`
- `FRONTEND_URL=https://tynasystems.com`

Required for wallet deposits and Paystack checkout:

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_CHECKOUT_CURRENCY`
- `PAYSTACK_SUPPORTED_CURRENCIES`
- `PAYSTACK_CALLBACK_URL`
- `PAYSTACK_PROJECT_CALLBACK_URL`

Required for translation:

- `AZURE_TRANSLATOR_KEY`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_TRANSLATOR_ENDPOINT`

After adding/changing Vercel environment variables, redeploy the Production deployment.

## Production checks after deployment

1. Open `https://tynasystems.com/api/health`.
2. Confirm `env.mongodb` is `true` and `login.jwtConfigured` is `true`.
3. Open the login page and sign in.
4. Open Dashboard -> Wallet and confirm balance loads.
5. Test a small Paystack wallet deposit.
6. Test a wallet product purchase using a test/low-value product as appropriate.
7. Test `Pay Admin with Wallet` and confirm the credit appears in Admin -> Wallet.

## Fixes included in this build

- Translation API no longer waits for MongoDB before responding.
- Login UI now reports a useful API/configuration error instead of only a generic request failure.
- User wallet balance is persisted and protected against spending more than the available balance.
- Users can buy products with Wallet or Paystack.
- Users can pay Tyna Systems Admin directly from wallet balance.
- Wallet debits and admin payments create transaction references and history records.
- Admin wallet shows recent company credits and direct user wallet payments.
