---
name: shadcn-ui
description: Best practices and rules for using Shadcn UI in Next.js applications
metadata:
  tags: shadcn, ui, components, react, tailwind, frontend
---

## When to use

Use this skill whenever you are adding, modifying, or styling components from Shadcn UI.

## Core Principles

- **Not a dependency**: Shadcn UI is a collection of re-usable components that you copy and paste into your apps. You do not install it as a dependency.
- **Adding components**: To add a component, ALWAYS use the CLI. Do not manually copy-paste the component code from the web.
  ```bash
  npx shadcn@latest add [component-name]
  ```
- **Component location**: Added components are placed in `src/components/ui/`.
- **Utility functions**: Uses `cn()` utility from `src/lib/utils.ts` to merge Tailwind classes conditionally using `clsx` and `tailwind-merge`.

## Styling and Theming

- **Tailwind CSS v4**: This project uses Tailwind CSS v4. Shadcn UI variables are defined in `src/app/globals.css` using CSS variables (e.g., `--background`, `--foreground`, `--primary`).
- **Color Variables**: Use semantic Tailwind classes like `bg-primary`, `text-muted-foreground`, `border-border` instead of hardcoded colors.
- **Customization**: You can freely modify the code inside `src/components/ui/` to fit your specific needs. They are YOUR components now.

## Accessibility (a11y)

- Shadcn UI uses Radix UI primitives under the hood, which means they are fully accessible by default (keyboard navigation, ARIA attributes, screen reader support).
- Do not remove ARIA attributes or break the underlying Radix UI behavior when customizing the components.

## Common Components

- **Button**: `import { Button } from "@/components/ui/button"`
- **Input**: `import { Input } from "@/components/ui/input"`
- **Card**: `import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"`
- **Dialog/Modal**: `import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"`

When tasked with building a complex interface, always check if there is an existing Shadcn component that can serve as the base before building from scratch.
