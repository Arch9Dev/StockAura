# StockAura

Inventory and stock management system with role-based access control, transactional stock tracking, and a structural audit trail.

Built as a portfolio project to demonstrate relational data modelling, authentication/authorisation, and real-world business logic beyond basic CRUD.

## Features

- **Authentication & RBAC** — JWT-based auth with three roles (Staff, Manager, Admin), each with different permissions
- **Product management** — full CRUD, search, filtering, sorting, and pagination
- **Stock movements** — every stock change (restock, sale, return, adjustment) is recorded transactionally with the user who made it, never a raw quantity edit
- **Archiving** — products with stock history are archived rather than deleted, preserving referential integrity
- **Audit trail** — structural changes (product/supplier created, updated, archived) are logged separately from stock movements
- **Rate limiting** — auth endpoints are protected against brute-force attempts

## Tech Stack

**Frontend:** Next.js, React, TypeScript, Tailwind CSS
**Backend:** Express, TypeScript
**Database:** PostgreSQL
**ORM:** Prisma 7 (with `@prisma/adapter-pg`)
**Auth:** JWT, bcrypt

## Project Structure

```
StockAura/
├── backend/          # Express API
│   ├── prisma/       # Schema and migrations
│   └── src/
│       ├── routes/   # API routes (products, suppliers, auth, stock-movements, dashboard)
│       ├── middleware/
│       └── lib/
└── frontend/         # Next.js app
    └── src/
        ├── app/       # Pages (login, signup, products, dashboard)
        ├── context/   # Auth context
        ├── components/
        └── lib/       # API client
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL installed and running locally

### 1. Clone and install
```bash
git clone <repo-url>
cd StockAura

cd backend
npm install

cd ../frontend
npm install
```

### 2. Set up the database
Create a local Postgres database:
```bash
psql -U postgres -c "CREATE DATABASE stockaura;"
```

### 3. Configure environment variables

**`backend/.env`:**
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/stockaura"
JWT_SECRET="your-random-secret-string"
FRONTEND_URL="http://localhost:3000"
```

**`frontend/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 4. Run migrations and generate the Prisma client
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 5. Start both servers

In `backend`:
```bash
npm run dev
```

In a separate terminal, in `frontend`:
```bash
npm run dev
```

- Backend runs on `http://localhost:4000`
- Frontend runs on `http://localhost:3000`

### 6. Create an account
Visit `http://localhost:3000/signup` to register. New accounts default to the `STAFF` role. To test Manager/Admin features, promote your account's role directly in the database via Prisma Studio:
```bash
cd backend
npx prisma studio
```
Open the `User` table and change your account's `role` field, then log out and back in.

## Roles & Permissions

| Action | Staff | Manager | Admin |
|---|:---:|:---:|:---:|
| View products/suppliers | Yes | Yes | Yes |
| Record stock movements | Yes | Yes | Yes |
| Create/edit products | No | Yes | Yes |
| Create/edit suppliers | No | Yes | Yes |
| Archive/delete products | No | No | Yes |
| Delete suppliers | No | No | Yes |

## Design Notes

- **Stock changes always go through `StockMovement`**, never a direct quantity edit, so every change to inventory levels is attributable to a user and a reason.
- **Archiving instead of deleting**: products with stock history can't be hard-deleted, since that would destroy the audit trail. They're archived (hidden, not removed) instead.
- **`StockMovement` vs `AuditLog`**: stock-level changes are tracked in `StockMovement` (which is itself an audit trail by design); `AuditLog` is reserved for structural changes to products and suppliers, keeping each table focused on one responsibility.

## Known Limitations

This is an active portfolio project. Current gaps include:
- No automated test suite yet
- No seed script (test data is created manually)
- Some destructive actions still use native browser confirmation dialogs rather than in-app modals