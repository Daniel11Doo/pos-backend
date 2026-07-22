-- AlterTable
ALTER TABLE "Usuario"
  ADD COLUMN "usuario" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "avatarPublicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "Usuario"("usuario");
