-- AlterTable
ALTER TABLE "MovimientoCaja" ADD COLUMN     "ventaId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MovimientoCaja_ventaId_key" ON "MovimientoCaja"("ventaId");

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
