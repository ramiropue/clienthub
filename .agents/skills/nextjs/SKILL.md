---
name: nextjs-app-router
description: Best practices and knowledge for Next.js 14 App Router
metadata:
  tags: nextjs, react, app-router, frontend
---

## When to use

Use this skill whenever you are writing or modifying Next.js code, especially involving the App Router (`app/` directory), Server Components, and API Routes.

## Core Principles

- **Server Components by Default:** All components inside `app/` are Server Components by default. Use them to fetch data securely and reduce client bundle size.
- **Client Components:** Only use `"use client";` at the top of a file when you need interactivity (hooks like `useState`, `useEffect`), event listeners (`onClick`), or browser APIs.
- **Routing:** Use folder names for routes. `page.tsx` represents the UI for a route. `layout.tsx` is for shared UI.
- **Data Fetching:** Fetch data directly in Server Components using async/await. Avoid using `useEffect` for data fetching unless strictly necessary in a Client Component.

## ClientHub Specifics

- Routes are structured in `(admin)/` and `(client)/` route groups to separate layouts and middleware logic without affecting the URL path.
- All files should use `kebab-case`.
- Always use named exports for components, never default exports.
