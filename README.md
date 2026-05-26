# POS Backend

API REST para un sistema de punto de venta (POS) construida con NestJS, Prisma y PostgreSQL.

## Stack

- **Framework:** NestJS 11
- **ORM:** Prisma 7
- **Base de datos:** PostgreSQL 16
- **Autenticación:** JWT + Passport
- **Lenguaje:** TypeScript

## Requisitos previos

- [Node.js](https://nodejs.org/) >= 20
- [Docker](https://www.docker.com/) y Docker Compose

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd pos-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pos_db"
JWT_SECRET="cambia_este_secreto_en_produccion"
JWT_EXPIRES_IN="8h"
PORT=3000
```

### 4. Levantar la base de datos con Docker

```bash
docker compose up -d
```

Esto levanta un contenedor PostgreSQL 16 en el puerto `5432` con:
- **Usuario:** `postgres`
- **Contraseña:** `postgres`
- **Base de datos:** `pos_db`

### 5. Ejecutar migraciones

```bash
npx prisma migrate dev
```

### 6. Iniciar el servidor

```bash
# Desarrollo (con hot reload)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

La API estará disponible en `http://localhost:3000`.

## Estructura del proyecto

```
src/
├── prisma/               # PrismaService y PrismaModule (global)
├── modules/
│   ├── auth/             # Login y autenticación JWT
│   ├── users/            # Gestión de usuarios
│   ├── categories/       # Categorías de productos
│   ├── products/         # Productos
│   ├── sales/            # Ventas e ítems de venta
│   ├── cash-registers/   # Cajas y sesiones de caja
│   └── inventory/        # Movimientos de inventario
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

## Scripts disponibles

```bash
npm run start:dev          # Servidor en modo desarrollo
npm run build              # Compilar para producción
npm run lint               # Verificar estilo de código
npm run test               # Ejecutar tests unitarios
npm run test:e2e           # Ejecutar tests end-to-end
npx prisma studio          # Interfaz visual de la base de datos
npx prisma migrate dev     # Aplicar migraciones pendientes
```

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://user:pass@localhost:5432/pos_db` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | `mi_secreto_seguro` |
| `JWT_EXPIRES_IN` | Duración del token JWT | `8h` |
| `PORT` | Puerto del servidor | `3000` |
