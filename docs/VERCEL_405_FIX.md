# HTTP 405 login fix

This build removes the legacy `builds` + `routes` Vercel configuration and uses Vercel Functions + `rewrites` instead.

The API rewrite sends every `/api/*` request to the Express function at `api/index.js`, including POST requests such as:

- `POST /api/auth/login`
- `POST /api/translator/translate`
- `POST /api/payments/...`

A database-independent routing probe is also included:

- `GET /api/route-check`
- `POST /api/route-check`

Both methods should return HTTP 200 after deployment. If GET works but POST returns 405, the Vercel project is not deploying from the repository root or is using an overridden project configuration.

Vercel Root Directory must be the repository root (`./`), where `vercel.json`, `api/`, `backend/`, and `frontend/` are all siblings.
