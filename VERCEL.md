# Vercel deployment

Lumora now uses Prisma's PostgreSQL adapter and Neon in production. A
`file:./dev.db` URL is local-development-only: the file is not committed,
serverless filesystems are ephemeral, and each deployment instance can have a
different filesystem.

## Required before deploying

1. Link the workspace to Neon and pull its variables with `neon link`, or set
	the Neon pooled `DATABASE_URL` in Vercel for **Production**, **Preview**,
	and **Development** as appropriate.
3. Set `AUTH_SECRET` in Vercel to a stable random value. Generate one with `openssl rand -base64 32`.
4. Apply the Prisma schema against Neon before opening the deployment. For a
	newly provisioned branch, run `npx prisma db push` with the Neon URL. The
	database must contain at least the `User`, `Session`, `Department`,
	`AuditLog`, `ConsentRecord`, and related tables.
5. Seed demo users only when this is an intentional demo deployment. Never depend on the local `dev.db` file from the repository.

## Current symptom

If `DATABASE_URL` is missing, still points to `file:./dev.db`, or the Neon
schema has not been applied, login, signup, dashboard loading, and consent
auditing cannot query their tables. The app now returns actionable auth errors
and keeps cookie consent working, but it cannot authenticate users until the
hosted database is configured and populated.

## After configuration

Redeploy, then verify:

- `/login` loads without a database error.
- `/register` lists departments.
- A seeded account can sign in and reaches its role dashboard.
- A new student can register.
- Accepting cookies closes the banner without a route error.
