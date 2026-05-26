import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TipoMovimientoInventario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMovimientoDto, usuarioId: string) {
    const producto = await this.prisma.producto.findUnique({ where: { id: dto.productoId } });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    if (!producto.activo) throw new BadRequestException('El producto está inactivo');

    const stockAnterior = producto.stock;
    const stockNuevo = this.calcularStockNuevo(dto.tipo, stockAnterior, dto.cantidad);

    return this.prisma.$transaction(async (tx) => {
      await tx.producto.update({
        where: { id: dto.productoId },
        data: { stock: stockNuevo },
      });

      return tx.movimientoInventario.create({
        data: {
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          stockAnterior,
          stockNuevo,
          notas: dto.notas,
          productoId: dto.productoId,
          usuarioId,
        },
        include: { producto: { select: { nombre: true } }, usuario: { select: { nombre: true } } },
      });
    });
  }

  findAll(productoId?: string) {
    return this.prisma.movimientoInventario.findMany({
      where: productoId ? { productoId } : undefined,
      include: { producto: { select: { nombre: true } }, usuario: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async findOne(id: string) {
    const movimiento = await this.prisma.movimientoInventario.findUnique({
      where: { id },
      include: { producto: { select: { nombre: true } }, usuario: { select: { nombre: true } } },
    });
    if (!movimiento) throw new NotFoundException('Movimiento no encontrado');
    return movimiento;
  }

  private calcularStockNuevo(tipo: TipoMovimientoInventario, stockActual: number, cantidad: number): number {
    switch (tipo) {
      case TipoMovimientoInventario.COMPRA:
      case TipoMovimientoInventario.DEVOLUCION:
      case TipoMovimientoInventario.INICIAL:
        return stockActual + cantidad;

      case TipoMovimientoInventario.VENTA:
        if (stockActual < cantidad) throw new BadRequestException(`Stock insuficiente. Disponible: ${stockActual}`);
        return stockActual - cantidad;

      case TipoMovimientoInventario.AJUSTE:
        return cantidad;
    }
  }
}
