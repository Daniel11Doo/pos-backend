import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistroClienteDto } from './dto/registro-cliente.dto';
import { IngresoClienteDto } from './dto/ingreso-cliente.dto';
import { UpdateConfiguracionFidelidadDto } from './dto/update-configuracion-fidelidad.dto';

const CONFIG_ID = 'default';

// Fecha de "hoy" sin hora, en UTC — es el valor que se guarda en
// VisitaFidelidad.fecha para que el @@unique([clienteId, fecha]) garantice
// como mucho un sello por cliente por día natural.
function hoy(): Date {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()));
}

@Injectable()
export class FidelidadService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(dto: RegistroClienteDto) {
    const existe = await this.prisma.cliente.findUnique({ where: { telefono: dto.telefono } });
    if (existe) throw new ConflictException('Ese teléfono ya está registrado, inicia sesión con tu número');

    return this.prisma.cliente.create({ data: dto });
  }

  async ingresar(dto: IngresoClienteDto) {
    const cliente = await this.prisma.cliente.findUnique({ where: { telefono: dto.telefono } });
    if (!cliente) throw new NotFoundException('No hay ningún cliente registrado con ese teléfono');
    return cliente;
  }

  async findOne(id: string) {
    const cliente = await this.prisma.cliente.findUnique({ where: { id } });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  findAll(busqueda?: string) {
    return this.prisma.cliente.findMany({
      where: busqueda
        ? { OR: [{ nombre: { contains: busqueda, mode: 'insensitive' } }, { telefono: { contains: busqueda } }] }
        : undefined,
      orderBy: { creadoEn: 'desc' },
    });
  }

  async marcarSello(clienteId: string, usuarioId: string) {
    const cliente = await this.findOne(clienteId);
    const config = await this.obtenerConfiguracion();
    const fecha = hoy();

    const yaVisitoHoy = await this.prisma.visitaFidelidad.findUnique({
      where: { clienteId_fecha: { clienteId, fecha } },
    });
    if (yaVisitoHoy) throw new ConflictException('Este cliente ya tiene un sello registrado hoy');

    const nuevosSellos = cliente.sellos + 1;
    const alcanzaRecompensa = nuevosSellos >= config.sellosParaRecompensa;

    const [, clienteActualizado] = await this.prisma.$transaction([
      this.prisma.visitaFidelidad.create({ data: { clienteId, fecha, registradoPorId: usuarioId } }),
      this.prisma.cliente.update({
        where: { id: clienteId },
        data: alcanzaRecompensa
          ? { sellos: 0, premiosDisponibles: { increment: 1 } }
          : { sellos: nuevosSellos },
      }),
    ]);

    return clienteActualizado;
  }

  async canjearPremio(clienteId: string) {
    const cliente = await this.findOne(clienteId);
    if (cliente.premiosDisponibles < 1) throw new BadRequestException('Este cliente no tiene premios disponibles');

    return this.prisma.cliente.update({
      where: { id: clienteId },
      data: { premiosDisponibles: { decrement: 1 } },
    });
  }

  async obtenerConfiguracion() {
    const config = await this.prisma.configuracionFidelidad.findUnique({ where: { id: CONFIG_ID } });
    if (config) return config;
    return this.prisma.configuracionFidelidad.create({ data: { id: CONFIG_ID } });
  }

  async actualizarConfiguracion(dto: UpdateConfiguracionFidelidadDto) {
    await this.obtenerConfiguracion();
    return this.prisma.configuracionFidelidad.update({ where: { id: CONFIG_ID }, data: dto });
  }
}
