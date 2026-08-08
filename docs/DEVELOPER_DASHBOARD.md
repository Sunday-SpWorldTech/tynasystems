# BYU Student Internship Developer System

This upgrade adds a separate developer area for Sunday Prince Augustine, FullStack Development Engineering.

## Public page
- `frontend/developer.html`
- Also available from `/developer` when served through Express.
- Added under the public `Menu` dropdown as **BYU Developer Internship**.

Students can submit project requests for pages, web apps, software, writing code, deployment help, and other technical work. They can upload ZIP files and other documents and continue the conversation using their request ID.

## Developer login
- `frontend/dev-login.html`
- Express alias: `/dev-login`
- Default credentials can be overridden in `backend/.env`:
  - `DEV_USERNAME=Sundayprince`
  - `DEV_PASSWORD=Nsikak77$$`
  - `DEV_EMAIL=support@tynasystems.com`

## Developer dashboard
- `frontend/dev-dashboard.html`
- Express alias: `/dev-dashboard`
- Separate from normal user pages and staff pages.
- Receives all requests from the public developer page.
- Developer can reply, attach files, and update request status.

## Backend API
- Public student request: `POST /api/developer/requests`
- Public load chat: `GET /api/developer/requests/:id`
- Public student reply: `POST /api/developer/requests/:id/messages`
- Private developer dashboard overview: `GET /api/developer/dashboard/overview`
- Private developer dashboard requests: `GET /api/developer/dashboard/requests`
- Private developer reply: `POST /api/developer/dashboard/requests/:id/reply`
- Private status update: `PATCH /api/developer/dashboard/requests/:id`

Uploaded files are stored in `backend/uploads/developer` and served from `/uploads/developer/...`.

