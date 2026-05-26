import { TipoMovimientoInventario } from '@prisma/client';

export class CreateMovimientoDto {
  productoId: string;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  notas?: string;
}
