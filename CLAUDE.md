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
