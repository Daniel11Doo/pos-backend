import { MetodoPago } from '@prisma/client';

export class ItemVentaDto {
  productoId: string;
  cantidad: number;
  precio: number;
}

export class CreateVentaDto {
  sesionCajaId: string;
  metodoPago: MetodoPago;
  items: ItemVentaDto[];
}
