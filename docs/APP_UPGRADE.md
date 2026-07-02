# Tyna Systems Web App Upgrade

This upgrade keeps all previous public pages and adds a live web-app layer:

- Client dashboard: `frontend/dashboard.html`
- Staff dashboard: `frontend/staff.html`
- Join Free page: `frontend/joinfree.html`
- Support page: `frontend/support.html`
- Contact staff page: `frontend/contact-staff.html`
- Settings page: `frontend/settings.html`

## Backend modules added

- JWT email/password auth
- Google Identity login route: `POST /api/auth/google`
- Staff role protection
- MongoDB models for users, products, orders, bookings, contacts, and support tickets
- Staff routes for overview, users, orders, bookings, and contacts
- Product CRUD and staff product upload
- Protected support tickets

## Create your staff account

Set these inside `backend/.env`:

```env
STAFF_EMAIL=staff@tynasystems.com
STAFF_PASSWORD=ChangeStaffPassword123!
```

Then run:

```powershell
cd backend
npm run seed
```

## Google login setup

Create an OAuth Client ID in Google Cloud Console and add it to backend `.env`:

```env
GOOGLE_CLIENT_ID=sample_google_client_id.apps.googleusercontent.com
```

Then add the same client ID inside the Google login div in `frontend/login.html` and `frontend/joinfree.html` where `data-client_id=""` appears.

## Product upload note

Staff can create products with image, YouTube demo, and download URL. Staff can also upload a file to `/uploads/products`. For production with permanent file storage, replace local uploads with Cloudinary, AWS S3, or another object storage service.


## 2026 Final Professional Upgrade
- Login and Join Free now use the same token-based dashboard flow while keeping their original color design.
- Dashboard access is protected by JWT/localStorage session checks.
- Private admin access exists, but public navigation and footer do not expose admin dashboard links.
- Admin Workspace includes a live Activity feed for registrations, logins, dashboard visits, checkout attempts, purchases, downloads, contact submissions, support actions, and admin actions.
- Home page only includes the new professional hero image asset.
- Typography, spacing, cards, buttons, and responsive styling were polished for LLC/company-standard presentation.

