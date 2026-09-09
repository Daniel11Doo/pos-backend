import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RolUsuario } from '@prisma/client';
import { FidelidadService } from './fidelidad.service';
import { RegistroClienteDto } from './dto/registro-cliente.dto';
import { IngresoClienteDto } from './dto/ingreso-cliente.dto';
import { UpdateConfiguracionFidelidadDto } from './dto/update-configuracion-fidelidad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const ROLES_STAFF = [RolUsuario.ADMIN, RolUsuario.GERENTE, RolUsuario.CAJERO];

@ApiTags('Fidelidad')
@Controller('fidelidad')
export class FidelidadController {
  constructor(private readonly fidelidadService: FidelidadService) {}

  // ─── Públicas (el cliente, sin sesión) ────────────────────────────────

  @Post('registro')
  @ApiOperation({ summary: 'Registrar un cliente nuevo en el programa de fidelidad' })
  @ApiResponse({ status: 201, description: 'Cliente registrado' })
  @ApiResponse({ status: 409, description: 'Teléfono ya registrado' })
  registrar(@Body() dto: RegistroClienteDto) {
    return this.fidelidadService.registrar(dto);
  }

  @Post('ingreso')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar la tarjeta de un cliente por su teléfono' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'No existe un cliente con ese teléfono' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos, espera un minuto' })
  ingresar(@Body() dto: IngresoClienteDto) {
    return this.fidelidadService.ingresar(dto);
  }

  @Get('configuracion')
  @ApiOperation({ summary: 'Configuración vigente del programa de fidelidad (sellos y recompensa)' })
  @ApiResponse({ status: 200, description: 'Configuración actual' })
  obtenerConfiguracion() {
    return this.fidelidadService.obtenerConfiguracion();
  }

  @Get('clientes/:id')
  @ApiOperation({ summary: 'Ver la tarjeta de un cliente' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  findOne(@Param('id') id: string) {
    return this.fidelidadService.findOne(id);
  }

  // ─── Staff (panel, requiere sesión) ───────────────────────────────────

  @Get('clientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLES_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar clientes del programa de fidelidad' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll(@Query('busqueda') busqueda?: string) {
    return this.fidelidadService.findAll(busqueda);
  }

  @Post('clientes/:id/sello')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLES_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar la visita/compra del día para un cliente' })
  @ApiResponse({ status: 200, description: 'Sello registrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'El cliente ya tiene un sello hoy' })
  marcarSello(@Param('id') id: string, @CurrentUser() usuario: { id: string }) {
    return this.fidelidadService.marcarSello(id, usuario.id);
  }

  @Post('clientes/:id/canjear')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ROLES_STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Canjear una recompensa disponible del cliente' })
  @ApiResponse({ status: 200, description: 'Recompensa canjeada' })
  @ApiResponse({ status: 400, description: 'El cliente no tiene recompensas disponibles' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  canjearPremio(@Param('id') id: string) {
    return this.fidelidadService.canjearPremio(id);
  }

  @Patch('configuracion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar los sellos requeridos y la descripción de la recompensa' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  actualizarConfiguracion(@Body() dto: UpdateConfiguracionFidelidadDto) {
    return this.fidelidadService.actualizarConfiguracion(dto);
  }
}
