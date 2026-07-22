import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TipoMovimientoInventario } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { CreateMovimientoInsumoDto } from './dto/create-movimiento-insumo.dto';

@Injectable()
export class InsumosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInsumoDto) {
    const existe = await this.prisma.insumo.findUnique({ where: { nombre: dto.nombre } });
    if (existe) throw new ConflictException('Ya existe un insumo con ese nombre');

    return this.prisma.insumo.create({ data: dto });
  }

  findAll(soloActivos = true) {
    return this.prisma.insumo.findMany({
      where: soloActivos ? { activo: true } : undefined,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const insumo = await this.prisma.insumo.findUnique({ where: { id } });
    if (!insumo) throw new NotFoundException('Insumo no encontrado');
    return insumo;
  }

  async update(id: string, dto: UpdateInsumoDto) {
    await this.findOne(id);

    if (dto.nombre) {
      const existe = await this.prisma.insumo.findFirst({ where: { nombre: dto.nombre, NOT: { id } } });
      if (existe) throw new ConflictException('Ya existe un insumo con ese nombre');
    }

    return this.prisma.insumo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const insumo = await this.findOne(id);

    const enUso = await this.prisma.productoInsumo.count({ where: { insumoId: id } });
    if (enUso > 0) {
      throw new BadRequestException('No se puede desactivar un insumo que está en la receta de algún producto');
    }

    // Soft delete: igual que Producto, un insumo puede tener historial de movimientos
    // que no se debe perder, así que solo se desactiva en vez de borrarse.
    if (!insumo.activo) return insumo;
    return this.prisma.insumo.update({ where: { id }, data: { activo: false } });
  }

  async ajustarStock(id: string, dto: CreateMovimientoInsumoDto, usuarioId: string) {
    const insumo = await this.findOne(id);

    const stockAnterior = insumo.stock;
    const stockNuevo = this.calcularStockNuevo(dto.tipo, Number(stockAnterior), dto.cantidad);

    return this.prisma.$transaction(async (tx) => {
      await tx.insumo.update({ where: { id }, data: { stock: stockNuevo } });

      return tx.movimientoInsumo.create({
        data: {
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          stockAnterior,
          stockNuevo,
          notas: dto.notas,
          insumoId: id,
          usuarioId,
        },
        include: { insumo: { select: { nombre: true, unidad: true } }, usuario: { select: { nombre: true } } },
      });
    });
  }

  findMovimientos(insumoId: string) {
    return this.prisma.movimientoInsumo.findMany({
      where: { insumoId },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
    });
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
