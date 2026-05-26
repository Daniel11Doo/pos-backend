import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TipoMovimientoInventario, TipoMovimientoCaja } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-sale.dto';

const TAX_RATE = 0.16;

const INCLUDE_VENTA = {
  items: { include: { producto: { select: { nombre: true } } } },
  usuario: { select: { nombre: true } },
  sesionCaja: { include: { caja: { select: { nombre: true } } } },
};

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVentaDto, usuarioId: string) {
    const sesion = await this.prisma.sesionCaja.findUnique({ where: { id: dto.sesionCajaId } });
    if (!sesion) throw new NotFoundException('Sesión de caja no encontrada');
    if (sesion.estado === 'CERRADA') throw new BadRequestException('La sesión de caja está cerrada');

    const productos = await Promise.all(
      dto.items.map(async (item) => {
        const producto = await this.prisma.producto.findUnique({ where: { id: item.productoId } });
        if (!producto) throw new NotFoundException(`Producto ${item.productoId} no encontrado`);
        if (!producto.activo) throw new BadRequestException(`El producto "${producto.nombre}" está inactivo`);
        if (producto.stock < item.cantidad) {
          throw new BadRequestException(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`);
        }
        return { ...item, producto };
      }),
    );

    const subtotal = productos.reduce((acc, { cantidad, producto }) => acc + Number(producto.precio) * cantidad, 0);
    const impuesto = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + impuesto) * 100) / 100;
    const folio = this.generarFolio();

    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.create({
        data: {
          folio,
          subtotal,
          impuesto,
          total,
          metodoPago: dto.metodoPago,
          usuarioId,
          sesionCajaId: dto.sesionCajaId,
          items: {
            create: productos.map(({ cantidad, producto }) => ({
              cantidad,
              precio: producto.precio,
              subtotal: Number(producto.precio) * cantidad,
              productoId: producto.id,
            })),
          },
        },
        include: INCLUDE_VENTA,
      });

      for (const { cantidad, producto } of productos) {
        const stockNuevo = producto.stock - cantidad;
        await tx.producto.update({ where: { id: producto.id }, data: { stock: stockNuevo } });
        await tx.movimientoInventario.create({
          data: {
            tipo: TipoMovimientoInventario.VENTA,
            cantidad,
            stockAnterior: producto.stock,
            stockNuevo,
            notas: `Venta folio ${folio}`,
            productoId: producto.id,
            usuarioId,
          },
        });
      }

      await tx.movimientoCaja.create({
        data: {
          tipo: TipoMovimientoCaja.VENTA,
          monto: total,
          notas: `Venta folio ${folio}`,
          sesionCajaId: dto.sesionCajaId,
          usuarioId,
        },
      });

      return venta;
    });
  }

  findAll() {
    return this.prisma.venta.findMany({ include: INCLUDE_VENTA, orderBy: { creadoEn: 'desc' } });
  }

  async findOne(id: string) {
    const venta = await this.prisma.venta.findUnique({ where: { id }, include: INCLUDE_VENTA });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    return venta;
  }

  async cancelar(id: string, usuarioId: string) {
    const venta = await this.findOne(id);
    if (venta.estado !== 'COMPLETADA') throw new BadRequestException('Solo se pueden cancelar ventas completadas');

    return this.prisma.$transaction(async (tx) => {
      for (const item of venta.items) {
        const producto = await tx.producto.findUnique({ where: { id: item.productoId } });
        const stockNuevo = producto!.stock + item.cantidad;
        await tx.producto.update({ where: { id: item.productoId }, data: { stock: stockNuevo } });
        await tx.movimientoInventario.create({
          data: {
            tipo: TipoMovimientoInventario.DEVOLUCION,
            cantidad: item.cantidad,
            stockAnterior: producto!.stock,
            stockNuevo,
            notas: `Cancelación venta folio ${venta.folio}`,
            productoId: item.productoId,
            usuarioId,
          },
        });
      }

      return tx.venta.update({
        where: { id },
        data: { estado: 'CANCELADA' },
        include: INCLUDE_VENTA,
      });
    });
  }

  async reembolsar(id: string, usuarioId: string) {
    const venta = await this.findOne(id);
    if (venta.estado !== 'COMPLETADA') throw new BadRequestException('Solo se pueden reembolsar ventas completadas');

    return this.prisma.$transaction(async (tx) => {
      for (const item of venta.items) {
        const producto = await tx.producto.findUnique({ where: { id: item.productoId } });
        const stockNuevo = producto!.stock + item.cantidad;
        await tx.producto.update({ where: { id: item.productoId }, data: { stock: stockNuevo } });
        await tx.movimientoInventario.create({
          data: {
            tipo: TipoMovimientoInventario.DEVOLUCION,
            cantidad: item.cantidad,
            stockAnterior: producto!.stock,
            stockNuevo,
            notas: `Reembolso venta folio ${venta.folio}`,
            productoId: item.productoId,
            usuarioId,
          },
        });
      }

      await tx.movimientoCaja.create({
        data: {
          tipo: TipoMovimientoCaja.REEMBOLSO,
          monto: venta.total,
          notas: `Reembolso venta folio ${venta.folio}`,
          sesionCajaId: venta.sesionCajaId,
          usuarioId,
        },
      });

      return tx.venta.update({
        where: { id },
        data: { estado: 'REEMBOLSADA' },
        include: INCLUDE_VENTA,
      });
    });
  }

  private generarFolio(): string {
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VTA-${fecha}-${random}`;
  }
}
