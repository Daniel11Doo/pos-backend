import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TipoMovimientoInventario, TipoMovimientoCaja } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-sale.dto';
import { UpdateVentaDto } from './dto/update-sale.dto';
import { CancelarVentaDto } from './dto/cancel-sale.dto';

const INCLUDE_VENTA = {
  items: { include: { producto: { select: { nombre: true, imagenUrl: true } } } },
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
    const impuesto = 0;
    const total = subtotal;
    const folio = this.generarFolio();

    const consumoInsumos = await this.agregarConsumoInsumos(productos);
    for (const { insumo, cantidad } of consumoInsumos) {
      if (Number(insumo.stock) < cantidad) {
        throw new BadRequestException(`Stock insuficiente de "${insumo.nombre}". Disponible: ${insumo.stock} ${insumo.unidad}`);
      }
    }

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
        const descontado = await tx.producto.updateMany({
          where: { id: producto.id, stock: { gte: cantidad } },
          data: { stock: { decrement: cantidad } },
        });
        if (descontado.count === 0) {
          throw new BadRequestException(`Stock insuficiente para "${producto.nombre}"`);
        }
        const actualizado = await tx.producto.findUniqueOrThrow({ where: { id: producto.id } });
        await tx.movimientoInventario.create({
          data: {
            tipo: TipoMovimientoInventario.VENTA,
            cantidad,
            stockAnterior: actualizado.stock + cantidad,
            stockNuevo: actualizado.stock,
            notas: `Venta folio ${folio}`,
            productoId: producto.id,
            usuarioId,
          },
        });
      }

      for (const { insumoId, insumo, cantidad } of consumoInsumos) {
        const descontado = await tx.insumo.updateMany({
          where: { id: insumoId, stock: { gte: cantidad } },
          data: { stock: { decrement: cantidad } },
        });
        if (descontado.count === 0) {
          throw new BadRequestException(`Stock insuficiente de "${insumo.nombre}"`);
        }
        const actualizado = await tx.insumo.findUniqueOrThrow({ where: { id: insumoId } });
        await tx.movimientoInsumo.create({
          data: {
            tipo: TipoMovimientoInventario.VENTA,
            cantidad,
            stockAnterior: Number(actualizado.stock) + cantidad,
            stockNuevo: Number(actualizado.stock),
            notas: `Venta folio ${folio}`,
            insumoId,
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
          ventaId: venta.id,
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

  async cancelar(id: string, dto: CancelarVentaDto, usuarioId: string) {
    const venta = await this.findOne(id);
    if (venta.estado !== 'COMPLETADA') throw new BadRequestException('Solo se pueden cancelar ventas completadas');
    if (venta.sesionCaja.estado === 'CERRADA') {
      throw new BadRequestException('No se puede cancelar una venta de una sesión de caja ya cerrada');
    }

    const notas = `Cancelación venta folio ${venta.folio}${dto.motivo ? ` · ${dto.motivo}` : ''}`;

    const consumoInsumos = await this.agregarConsumoInsumos(
      venta.items.map((item) => ({ cantidad: item.cantidad, producto: { id: item.productoId } })),
    );

    return this.prisma.$transaction(async (tx) => {
      // Transición atómica: si dos cancelaciones llegan a la vez para el mismo
      // ticket (doble tap en pantalla táctil, dos sesiones distintas), solo una
      // logra pasar de COMPLETADA a CANCELADA — la otra falla aquí antes de
      // tocar stock/caja, en vez de restaurar el stock y crear el REEMBOLSO dos veces.
      const canceladaAhora = await tx.venta.updateMany({
        where: { id, estado: 'COMPLETADA' },
        data: { estado: 'CANCELADA' },
      });
      if (canceladaAhora.count === 0) {
        throw new BadRequestException('La venta ya fue cancelada por otra operación');
      }

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
            notas,
            productoId: item.productoId,
            usuarioId,
          },
        });
      }

      for (const { insumoId, insumo, cantidad } of consumoInsumos) {
        const stockAnterior = Number(insumo.stock);
        const stockNuevo = stockAnterior + cantidad;
        await tx.insumo.update({ where: { id: insumoId }, data: { stock: stockNuevo } });
        await tx.movimientoInsumo.create({
          data: {
            tipo: TipoMovimientoInventario.DEVOLUCION,
            cantidad,
            stockAnterior,
            stockNuevo,
            notas,
            insumoId,
            usuarioId,
          },
        });
      }

      await tx.movimientoCaja.create({
        data: {
          tipo: TipoMovimientoCaja.REEMBOLSO,
          monto: venta.total,
          notas,
          sesionCajaId: venta.sesionCajaId,
          usuarioId,
        },
      });

      return tx.venta.findUniqueOrThrow({ where: { id }, include: INCLUDE_VENTA });
    });
  }

  async actualizar(id: string, dto: UpdateVentaDto, usuarioId: string) {
    const venta = await this.findOne(id);
    if (venta.estado !== 'COMPLETADA') throw new BadRequestException('Solo se pueden editar ventas completadas');
    if (venta.sesionCaja.estado === 'CERRADA') {
      throw new BadRequestException('No se puede editar una venta de una sesión de caja ya cerrada');
    }

    const cantidadAnteriorPorProducto = new Map<string, number>();
    for (const item of venta.items) {
      cantidadAnteriorPorProducto.set(item.productoId, (cantidadAnteriorPorProducto.get(item.productoId) ?? 0) + item.cantidad);
    }
    const cantidadNuevaPorProducto = new Map<string, number>();
    for (const item of dto.items) {
      cantidadNuevaPorProducto.set(item.productoId, (cantidadNuevaPorProducto.get(item.productoId) ?? 0) + item.cantidad);
    }

    const productoIds = [...new Set([...cantidadAnteriorPorProducto.keys(), ...cantidadNuevaPorProducto.keys()])];
    const productos = await this.prisma.producto.findMany({ where: { id: { in: productoIds } } });
    const productoPorId = new Map(productos.map((p) => [p.id, p]));

    // Si la cantidad de un producto no cambió, se respeta el precio con el que
    // ya se vendió — de lo contrario, editar el ticket para agregar/quitar OTRO
    // producto reprecia en silencio las líneas que no se tocaron si el catálogo
    // cambió de precio después de la venta original.
    const precioOriginalPorProducto = new Map(venta.items.map((item) => [item.productoId, item.precio]));
    const precioEfectivo = (productoId: string, cantidad: number) => {
      const original = precioOriginalPorProducto.get(productoId);
      const sinCambioDeCantidad = (cantidadAnteriorPorProducto.get(productoId) ?? 0) === cantidad;
      if (original !== undefined && sinCambioDeCantidad) return original;
      return productoPorId.get(productoId)!.precio;
    };

    const deltasProducto = productoIds
      .map((productoId) => {
        const producto = productoPorId.get(productoId);
        if (!producto) throw new NotFoundException(`Producto ${productoId} no encontrado`);
        const anterior = cantidadAnteriorPorProducto.get(productoId) ?? 0;
        const nueva = cantidadNuevaPorProducto.get(productoId) ?? 0;
        const delta = nueva - anterior;
        if (delta > 0 && !producto.activo) {
          throw new BadRequestException(`El producto "${producto.nombre}" está inactivo`);
        }
        if (delta > 0 && producto.stock < delta) {
          throw new BadRequestException(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`);
        }
        return { producto, delta };
      })
      .filter(({ delta }) => delta !== 0);

    const consumoAnterior = await this.agregarConsumoInsumos(
      [...cantidadAnteriorPorProducto].map(([id, cantidad]) => ({ cantidad, producto: { id } })),
    );
    const consumoNuevo = await this.agregarConsumoInsumos(
      [...cantidadNuevaPorProducto].map(([id, cantidad]) => ({ cantidad, producto: { id } })),
    );
    const consumoAnteriorPorInsumo = new Map(consumoAnterior.map((c) => [c.insumoId, c.cantidad]));
    const consumoNuevoPorInsumo = new Map(consumoNuevo.map((c) => [c.insumoId, c]));
    const insumoIds = [...new Set([...consumoAnteriorPorInsumo.keys(), ...consumoNuevoPorInsumo.keys()])];

    const deltasInsumo = insumoIds
      .map((insumoId) => {
        const nuevo = consumoNuevoPorInsumo.get(insumoId);
        const anterior = consumoAnteriorPorInsumo.get(insumoId) ?? 0;
        const delta = (nuevo?.cantidad ?? 0) - anterior;
        return { insumoId, insumo: nuevo?.insumo, delta };
      })
      .filter(({ delta }) => delta !== 0);

    for (const { insumoId, insumo, delta } of deltasInsumo) {
      if (delta > 0) {
        const actual = insumo ?? (await this.prisma.insumo.findUniqueOrThrow({ where: { id: insumoId } }));
        if (Number(actual.stock) < delta) {
          throw new BadRequestException(`Stock insuficiente de "${actual.nombre}". Disponible: ${actual.stock} ${actual.unidad}`);
        }
      }
    }

    const subtotal = dto.items.reduce(
      (acc, item) => acc + Number(precioEfectivo(item.productoId, item.cantidad)) * item.cantidad,
      0,
    );
    const total = subtotal;

    return this.prisma.$transaction(async (tx) => {
      for (const { producto, delta } of deltasProducto) {
        const stockAnterior = (await tx.producto.findUniqueOrThrow({ where: { id: producto.id } })).stock;
        if (delta > 0) {
          const descontado = await tx.producto.updateMany({
            where: { id: producto.id, stock: { gte: delta } },
            data: { stock: { decrement: delta } },
          });
          if (descontado.count === 0) throw new BadRequestException(`Stock insuficiente para "${producto.nombre}"`);
        } else {
          await tx.producto.update({ where: { id: producto.id }, data: { stock: { increment: -delta } } });
        }
        const actualizado = await tx.producto.findUniqueOrThrow({ where: { id: producto.id } });
        await tx.movimientoInventario.create({
          data: {
            tipo: TipoMovimientoInventario.AJUSTE,
            cantidad: Math.abs(delta),
            stockAnterior,
            stockNuevo: actualizado.stock,
            notas: `Edición venta folio ${venta.folio}`,
            productoId: producto.id,
            usuarioId,
          },
        });
      }

      for (const { insumoId, delta } of deltasInsumo) {
        const insumoActual = await tx.insumo.findUniqueOrThrow({ where: { id: insumoId } });
        const stockAnterior = Number(insumoActual.stock);
        if (delta > 0) {
          const descontado = await tx.insumo.updateMany({
            where: { id: insumoId, stock: { gte: delta } },
            data: { stock: { decrement: delta } },
          });
          if (descontado.count === 0) throw new BadRequestException(`Stock insuficiente de "${insumoActual.nombre}"`);
        } else {
          await tx.insumo.update({ where: { id: insumoId }, data: { stock: { increment: -delta } } });
        }
        const actualizado = await tx.insumo.findUniqueOrThrow({ where: { id: insumoId } });
        await tx.movimientoInsumo.create({
          data: {
            tipo: TipoMovimientoInventario.AJUSTE,
            cantidad: Math.abs(delta),
            stockAnterior,
            stockNuevo: Number(actualizado.stock),
            notas: `Edición venta folio ${venta.folio}`,
            insumoId,
            usuarioId,
          },
        });
      }

      await tx.venta.update({
        where: { id },
        data: {
          subtotal,
          total,
          metodoPago: dto.metodoPago ?? undefined,
          items: {
            deleteMany: {},
            create: dto.items.map((item) => {
              const precio = precioEfectivo(item.productoId, item.cantidad);
              return {
                cantidad: item.cantidad,
                precio,
                subtotal: Number(precio) * item.cantidad,
                productoId: item.productoId,
              };
            }),
          },
        },
      });

      const movimiento =
        (await tx.movimientoCaja.findUnique({ where: { ventaId: id } })) ??
        (await tx.movimientoCaja.findFirst({
          where: { sesionCajaId: venta.sesionCajaId, tipo: 'VENTA', notas: `Venta folio ${venta.folio}` },
        }));
      if (movimiento) {
        await tx.movimientoCaja.update({ where: { id: movimiento.id }, data: { monto: total } });
      }

      return tx.venta.findUniqueOrThrow({ where: { id }, include: INCLUDE_VENTA });
    });
  }

  async reembolsar(id: string, usuarioId: string) {
    const venta = await this.findOne(id);
    if (venta.estado !== 'COMPLETADA') throw new BadRequestException('Solo se pueden reembolsar ventas completadas');

    const consumoInsumos = await this.agregarConsumoInsumos(
      venta.items.map((item) => ({ cantidad: item.cantidad, producto: { id: item.productoId } })),
    );

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

      for (const { insumoId, insumo, cantidad } of consumoInsumos) {
        const stockAnterior = Number(insumo.stock);
        const stockNuevo = stockAnterior + cantidad;
        await tx.insumo.update({ where: { id: insumoId }, data: { stock: stockNuevo } });
        await tx.movimientoInsumo.create({
          data: {
            tipo: TipoMovimientoInventario.DEVOLUCION,
            cantidad,
            stockAnterior,
            stockNuevo,
            notas: `Reembolso venta folio ${venta.folio}`,
            insumoId,
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

  private async agregarConsumoInsumos(productos: { cantidad: number; producto: { id: string } }[]) {
    const productoIds = productos.map(({ producto }) => producto.id);
    const recetas = await this.prisma.productoInsumo.findMany({
      where: { productoId: { in: productoIds } },
      include: { insumo: true },
    });

    const consumo = new Map<string, { insumoId: string; insumo: (typeof recetas)[number]['insumo']; cantidad: number }>();

    for (const { cantidad: cantidadVendida, producto } of productos) {
      for (const linea of recetas.filter((r) => r.productoId === producto.id)) {
        const consumido = Number(linea.cantidad) * cantidadVendida;
        const actual = consumo.get(linea.insumoId);
        if (actual) actual.cantidad += consumido;
        else consumo.set(linea.insumoId, { insumoId: linea.insumoId, insumo: linea.insumo, cantidad: consumido });
      }
    }

    return [...consumo.values()];
  }

  private generarFolio(): string {
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VTA-${fecha}-${random}`;
  }
}
