# Vercel deployment

This repository deploys the frontend and backend together in one Vercel project.

- Project root: repository root (`./`)
- Node.js: `20.x`
- Frontend: static files from `frontend/`
- Backend: Express serverless function at `api/index.js`
- API base URL: `/api`
- Production site: `https://tynasystems.com`

Do not set `PORT=10000` in Vercel. Add private values in Vercel Project Settings → Environment Variables and never commit `.env` files.
