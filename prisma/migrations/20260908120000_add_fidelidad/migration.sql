-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "sellos" INTEGER NOT NULL DEFAULT 0,
    "premiosDisponibles" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitaFidelidad" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "clienteId" TEXT NOT NULL,
    "registradoPorId" TEXT NOT NULL,

    CONSTRAINT "VisitaFidelidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionFidelidad" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "sellosParaRecompensa" INTEGER NOT NULL DEFAULT 8,
    "descripcionRecompensa" TEXT NOT NULL DEFAULT 'Postre gratis',

    CONSTRAINT "ConfiguracionFidelidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefono_key" ON "Cliente"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "VisitaFidelidad_clienteId_fecha_key" ON "VisitaFidelidad"("clienteId", "fecha");

-- AddForeignKey
ALTER TABLE "VisitaFidelidad" ADD CONSTRAINT "VisitaFidelidad_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaFidelidad" ADD CONSTRAINT "VisitaFidelidad_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
