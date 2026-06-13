# MongoDB Setup

Create a MongoDB Atlas cluster named `TynaSystemsCluster` and a database named `tynasystems`.

Recommended collections are created automatically by Mongoose:

- users
- products
- orders
- contacts

Run seed:

```bash
cd backend
npm run seed
```

Seed admin:

- Email: `admin@tynasystems.com`
- Password: `ChangeMe123!`

Change this password before production use.
