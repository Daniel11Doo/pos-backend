# CLAUDE.md — pos-backend

> Contexto general del proyecto (quién soy, tono, reglas de trabajo) está en
> `../CLAUDE.md`. Esto es lo específico del backend.

## Stack

- NestJS 11 + TypeScript
- Prisma 7 + PostgreSQL 16 (vía `@prisma/adapter-pg`)
- Auth: JWT + Passport (`@nestjs/jwt`, `passport-jwt`)
- Validación: `class-validator` / `class-transformer`
- Imágenes: Cloudinary
- Docs de API: `@nestjs/swagger`
- Deploy: Railway (`railway.toml`) / Vercel (`vercel.json`)
- Lint/format: ESLint + Prettier
- Tests: Jest (unit en `src/**/*.spec.ts`, e2e en `test/`)

## Estructura

```
src/
├── prisma/               # PrismaService y PrismaModule (global)
└── modules/
    ├── auth/             # Login y autenticación JWT
    ├── users/            # Gestión de usuarios
    ├── categories/       # Categorías de productos
    ├── products/         # Productos
    ├── sales/            # Ventas e ítems de venta
    ├── cash-registers/   # Cajas y sesiones de caja
    └── inventory/        # Movimientos de inventario
prisma/
├── schema.prisma         # Modelos de la base de datos
└── migrations/           # Historial de migraciones
```

## Roles de usuario

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total al sistema |
| `GERENTE` | Gestión de productos, reportes y cajas |
| `CAJERO` | Registro de ventas y apertura/cierre de caja |

## Comandos

```bash
npm run start:dev          # servidor en modo desarrollo
npm run build              # compilar para producción (incluye prisma generate)
npm run lint                # ESLint --fix
npm run test                # tests unitarios
npm run test:e2e            # tests end-to-end
npx prisma migrate dev      # aplicar migraciones pendientes
npx prisma studio           # UI de la base de datos
```

## Tareas que quiero automatizar aquí

- Nuevos módulos NestJS completos (controller + service + DTOs + tests) que
  sigan el mismo patrón que los módulos ya existentes en `src/modules/`
  (mismo estilo de DTOs con `class-validator`, mismo manejo de roles vía
  guards/decorators, mismo layout de carpetas).
- Cambios de esquema con su migración correspondiente en `prisma/schema.prisma`
  + `prisma/migrations/` — nunca editar una migración ya aplicada, siempre
  generar una nueva.
- Endpoints de reportes (ventas, inventario) que alimenten el Dashboard del
  frontend.

## Notas específicas

- Todo endpoint nuevo debe declarar el rol requerido explícitamente; no asumas
  el rol por el nombre del módulo.
- Los DTOs son la fuente de verdad de validación de entrada — no dupliques
  validaciones a mano dentro del service si el DTO ya las cubre.
- Antes de tocar `schema.prisma`, revisa las migraciones existentes en
  `prisma/migrations/` para mantener el estilo de nombres y de constraints.

## Arquitectura de deploy (Vercel serverless + Railway)

- `PrismaService` es singleton vía `@Global()` (`prisma.module.ts`), y
  `main.ts` cachea la instancia de Nest entre invocaciones warm de la función
  serverless de Vercel — no crear un `PrismaClient` nuevo por request, se
  agotaría el pool de conexiones de Neon/Postgres.
- `sales.service.ts` envuelve venta + descuento de insumos/inventario +
  movimiento de caja en un solo `$transaction` (atómico). El descuento de
  stock de producto e insumo usa `updateMany` con `where: { stock: { gte } }`
  + `decrement` (update condicional atómico a nivel SQL) en vez de leer y
  restar en JS — así no se puede sobrevender aunque dos ventas del mismo
  producto se procesen casi al mismo tiempo. Si se toca esta lógica, mantener
  el patrón `updateMany` + chequeo de `count`, no volver a un
  `findUnique` + `update` con el valor leído antes de la transacción.
- No hay `ExceptionFilter` global: un error de Prisma conocido (P2002 unique,
  P2025 not found, P2003 FK) llega al cliente como 500 genérico en vez de un
  4xx legible. Si agregas un filtro global, hazlo para todo `src/`, no parche
  por controller.
- `src/main.ts` valida al arrancar (`validateEnv`) que `JWT_SECRET` y
  `DATABASE_URL` existan — si falta alguna, el proceso truena de inmediato
  con un mensaje claro en vez de fallar silenciosamente en el primer login.
  Si agregas otra env var que sea indispensable para que el servicio
  funcione (no un feature opcional), súmala a `REQUIRED_ENV_VARS`.
