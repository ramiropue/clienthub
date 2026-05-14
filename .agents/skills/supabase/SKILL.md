---
name: supabase-best-practices
description: Best practices for Supabase database, auth, and RLS
metadata:
  tags: supabase, database, auth, backend, postgres
---

## When to use

Use this skill whenever you are dealing with database queries, authentication, or Row Level Security (RLS) policies in Supabase.

## Core Principles

- **Server-Side Client:** Always use the appropriate Supabase client (e.g., from `@supabase/ssr`) depending on whether you are in a Server Component, Client Component, Server Action, or Route Handler.
- **Row Level Security (RLS):** RLS must be enabled on all tables. Policies dictate who can select, insert, update, or delete rows.
- **Data Fetching:** Never fetch data directly in UI components. Always use the functions defined in `src/lib/supabase/`.

## ClientHub Specifics

- **Roles:** The `profiles` table contains a `role` column (`admin` or `client`). Ensure queries respect this role.
- **Migrations:** Never edit the database directly from the Supabase dashboard. All schema changes must be done via migration files in `supabase/migrations/`.
- Ensure proper TypeScript typing for all Supabase queries.
