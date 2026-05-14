# ClientHub — Contexto del proyecto

## Qué es esta app

Herramienta de gestión de clientes para una agencia de redes sociales.
- **Admin (yo):** añadir clientes, registrar trabajos, ver facturación total
- **Cliente:** login propio, ver trabajos del mes, ver total facturado

## Stack

- Next.js 14 con App Router
- TypeScript estricto
- Supabase (auth + base de datos + Row Level Security)
- Tailwind CSS

## Estructura de carpetas
src/
app/              → rutas de Next.js (App Router)
(admin)/        → rutas protegidas solo para admin
(client)/       → rutas protegidas para clientes
api/            → API routes
components/       → componentes reutilizables
ui/             → componentes de interfaz genéricos
admin/          → componentes solo del panel admin
client/         → componentes solo del panel cliente
lib/
supabase/       → cliente de Supabase y queries
utils/          → funciones de utilidad
types/            → tipos TypeScript compartidos
hooks/            → custom hooks de React
supabase/
migrations/       → migraciones de base de datos
## Convenciones de código

- Archivos: kebab-case (ejemplo: work-card.tsx)
- Componentes: PascalCase (ejemplo: WorkCard)
- Funciones y variables: camelCase (ejemplo: getClientWorks)
- Siempre named exports — nunca default export en componentes
- Interfaces TypeScript para todos los modelos de datos

## Arquitectura de datos

Entidades principales:
- `profiles` → usuarios (admin y clientes), vinculados a auth.users
- `clients` → clientes de la agencia
- `works` → trabajos realizados (tipo, descripción, tarifa, fecha, mes, cliente_id)

Tipos de trabajo:
- Creación de contenido
- Estrategia

## Reglas de base de datos

- Nunca hacer queries directas en componentes → siempre usar funciones de src/lib/supabase/
- Todas las queries con manejo de errores explícito
- Row Level Security activado en todas las tablas
- Migraciones en supabase/migrations — nunca editar la DB directamente desde el dashboard

## Roles y autenticación

- Rol `admin`: acceso total — rutas /admin/*
- Rol `client`: acceso solo a sus propios datos — rutas /dashboard/*
- Los roles se gestionan con un campo `role` en la tabla `profiles`
- Middleware de Next.js protege todas las rutas según rol
