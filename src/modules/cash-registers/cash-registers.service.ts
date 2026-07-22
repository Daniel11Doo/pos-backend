import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { TipoMovimientoCaja } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCajaDto, UpdateCajaDto } from './dto/caja.dto';
import { AbrirSesionDto, CerrarSesionDto } from './dto/sesion.dto';
import { CreateMovimientoCajaDto } from './dto/movimiento-caja.dto';

const INCLUDE_SESION = {
  caja: { select: { nombre: true } },
  abiertaPor: { select: { nombre: true } },
  cerradaPor: { select: { nombre: true } },
};

@Injectable()
export class CashRegistersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Caja ────────────────────────────────────────────────────────────────────

  create(dto: CreateCajaDto) {
    return this.prisma.caja.create({ data: dto });
  }

  findAllCajas() {
    return this.prisma.caja.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOneCaja(id: string) {
    const caja = await this.prisma.caja.findUnique({ where: { id } });
    if (!caja) throw new NotFoundException('Caja no encontrada');
    return caja;
  }

  async updateCaja(id: string, dto: UpdateCajaDto) {
    await this.findOneCaja(id);
    return this.prisma.caja.update({ where: { id }, data: dto });
  }

  async removeCaja(id: string) {
    await this.findOneCaja(id);
    return this.prisma.caja.update({ where: { id }, data: { activa: false } });
  }

  // ─── Sesión ───────────────────────────────────────────────────────────────────

  async abrirSesion(dto: AbrirSesionDto, usuarioId: string) {
    const caja = await this.findOneCaja(dto.cajaId);
    if (!caja.activa) throw new BadRequestException('La caja está inactiva');

    const sesionAbierta = await this.prisma.sesionCaja.findFirst({
      where: { cajaId: dto.cajaId, estado: 'ABIERTA' },
    });
    if (sesionAbierta) throw new ConflictException('Ya hay una sesión abierta para esta caja');

    return this.prisma.sesionCaja.create({
      data: {
        cajaId: dto.cajaId,
        montoApertura: dto.montoApertura,
        abiertaPorId: usuarioId,
      },
      include: INCLUDE_SESION,
    });
  }

  async cerrarSesion(id: string, dto: CerrarSesionDto, usuarioId: string) {
    const sesion = await this.findOneSesion(id);
    if (sesion.estado === 'CERRADA') throw new BadRequestException('La sesión ya está cerrada');

    const movimientos = await this.prisma.movimientoCaja.findMany({ where: { sesionCajaId: id } });

    const montoEsperado = movimientos.reduce((acc, mov) => {
      const monto = Number(mov.monto);
      if (mov.tipo === TipoMovimientoCaja.VENTA || mov.tipo === TipoMovimientoCaja.INGRESO) return acc + monto;
      return acc - monto;
    }, Number(sesion.montoApertura));

    const diferencia = dto.montoCierre - montoEsperado;

    return this.prisma.sesionCaja.update({
      where: { id },
      data: {
        montoCierre: dto.montoCierre,
        montoEsperado,
        diferencia,
        estado: 'CERRADA',
        cerradaEn: new Date(),
        cerradaPorId: usuarioId,
      },
      include: INCLUDE_SESION,
    });
  }

  findAllSesiones(cajaId?: string) {
    return this.prisma.sesionCaja.findMany({
      where: cajaId ? { cajaId } : undefined,
      include: INCLUDE_SESION,
      orderBy: { abiertaEn: 'desc' },
    });
  }

  async findOneSesion(id: string) {
    const sesion = await this.prisma.sesionCaja.findUnique({ where: { id }, include: INCLUDE_SESION });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    return sesion;
  }

  // ─── Movimientos de caja ──────────────────────────────────────────────────────

  async addMovimiento(sesionId: string, dto: CreateMovimientoCajaDto, usuarioId: string) {
    const sesion = await this.findOneSesion(sesionId);
    if (sesion.estado === 'CERRADA') throw new BadRequestException('No se pueden agregar movimientos a una sesión cerrada');

    return this.prisma.movimientoCaja.create({
      data: { ...dto, sesionCajaId: sesionId, usuarioId },
      include: { usuario: { select: { nombre: true } } },
    });
  }

  findMovimientos(sesionId: string) {
    return this.prisma.movimientoCaja.findMany({
      where: { sesionCajaId: sesionId },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
    });
  }

  findAllMovimientos() {
    return this.prisma.movimientoCaja.findMany({
      include: { usuario: { select: { nombre: true } } },
      orderBy: { creadoEn: 'desc' },
    });
  }
}
