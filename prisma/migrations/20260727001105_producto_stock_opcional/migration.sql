-- AlterTable
ALTER TABLE "Producto" ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "stock" DROP DEFAULT;

-- Por ahora ningun producto lleva stock propio (solo se controla por insumo) --
UPDATE "Producto" SET "stock" = NULL;
