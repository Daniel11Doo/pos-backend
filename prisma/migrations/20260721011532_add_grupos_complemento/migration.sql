-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "grupoComplementoId" TEXT;

-- CreateTable
CREATE TABLE "GrupoComplemento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrupoComplemento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductoGrupoComplemento" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "grupoComplementoId" TEXT NOT NULL,

    CONSTRAINT "ProductoGrupoComplemento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrupoComplemento_nombre_key" ON "GrupoComplemento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoGrupoComplemento_productoId_grupoComplementoId_key" ON "ProductoGrupoComplemento"("productoId", "grupoComplementoId");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_grupoComplementoId_fkey" FOREIGN KEY ("grupoComplementoId") REFERENCES "GrupoComplemento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoGrupoComplemento" ADD CONSTRAINT "ProductoGrupoComplemento_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoGrupoComplemento" ADD CONSTRAINT "ProductoGrupoComplemento_grupoComplementoId_fkey" FOREIGN KEY ("grupoComplementoId") REFERENCES "GrupoComplemento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
