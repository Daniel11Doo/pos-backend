import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CashRegistersService } from './cash-registers.service';
import { CreateCajaDto, UpdateCajaDto } from './dto/caja.dto';
import { AbrirSesionDto, CerrarSesionDto } from './dto/sesion.dto';
import { CreateMovimientoCajaDto } from './dto/movimiento-caja.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolUsuario } from '@prisma/client';

@ApiTags('Cash Registers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cash-registers')
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  // ─── Caja ────────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear caja' })
  @ApiResponse({ status: 201, description: 'Caja creada' })
  create(@Body() dto: CreateCajaDto) {
    return this.cashRegistersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cajas' })
  @ApiResponse({ status: 200, description: 'Lista de cajas' })
  findAllCajas() {
    return this.cashRegistersService.findAllCajas();
  }

  // ─── Sesiones ─────────────────────────────────────────────────────────────────
  // Nota: estas rutas literales ('sessions', 'sessions/:id/...') deben declararse
  // antes que 'Caja' -> @Get(':id')/@Patch(':id')/@Delete(':id'), porque Nest
  // registra las rutas en orden de declaración y ':id' capturaría "sessions"
  // como si fuera el id de una caja.

  @Post('sessions')
  @ApiOperation({ summary: 'Abrir sesión de caja' })
  @ApiResponse({ status: 201, description: 'Sesión abierta' })
  @ApiResponse({ status: 409, description: 'Ya hay una sesión abierta para esta caja' })
  abrirSesion(@Body() dto: AbrirSesionDto, @CurrentUser() usuario: { id: string }) {
    return this.cashRegistersService.abrirSesion(dto, usuario.id);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Listar sesiones' })
  @ApiQuery({ name: 'cajaId', required: false, description: 'Filtrar por caja' })
  @ApiResponse({ status: 200, description: 'Lista de sesiones' })
  findAllSesiones(@Query('cajaId') cajaId?: string) {
    return this.cashRegistersService.findAllSesiones(cajaId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Obtener sesión por ID' })
  @ApiResponse({ status: 200, description: 'Sesión encontrada' })
  @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
  findOneSesion(@Param('id') id: string) {
    return this.cashRegistersService.findOneSesion(id);
  }

  @Post('sessions/:id/close')
  @ApiOperation({ summary: 'Cerrar sesión de caja' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada con montoEsperado y diferencia calculados' })
  @ApiResponse({ status: 400, description: 'La sesión ya está cerrada' })
  cerrarSesion(
    @Param('id') id: string,
    @Body() dto: CerrarSesionDto,
    @CurrentUser() usuario: { id: string },
  ) {
    return this.cashRegistersService.cerrarSesion(id, dto, usuario.id);
  }

  // ─── Movimientos ──────────────────────────────────────────────────────────────

  @Post('sessions/:id/movements')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Registrar movimiento de caja manual' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado' })
  @ApiResponse({ status: 400, description: 'Sesión cerrada' })
  addMovimiento(
    @Param('id') id: string,
    @Body() dto: CreateMovimientoCajaDto,
    @CurrentUser() usuario: { id: string },
  ) {
    return this.cashRegistersService.addMovimiento(id, dto, usuario.id);
  }

  @Get('sessions/:id/movements')
  @ApiOperation({ summary: 'Listar movimientos de una sesión' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos' })
  findMovimientos(@Param('id') id: string) {
    return this.cashRegistersService.findMovimientos(id);
  }

  // Nota: 'movements' (literal) debe declararse antes que 'Caja' -> @Get(':id'),
  // por la misma razón explicada arriba para 'sessions'.
  @Get('movements')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Listar todos los movimientos de caja (todas las sesiones)' })
  @ApiResponse({ status: 200, description: 'Lista completa de movimientos, para reportes' })
  findAllMovimientos() {
    return this.cashRegistersService.findAllMovimientos();
  }

  // ─── Caja ────────────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Obtener caja por ID' })
  @ApiResponse({ status: 200, description: 'Caja encontrada' })
  @ApiResponse({ status: 404, description: 'Caja no encontrada' })
  findOneCaja(@Param('id') id: string) {
    return this.cashRegistersService.findOneCaja(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Actualizar caja' })
  @ApiResponse({ status: 200, description: 'Caja actualizada' })
  updateCaja(@Param('id') id: string, @Body() dto: UpdateCajaDto) {
    return this.cashRegistersService.updateCaja(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Desactivar caja (soft delete)' })
  @ApiResponse({ status: 200, description: 'Caja desactivada' })
  removeCaja(@Param('id') id: string) {
    return this.cashRegistersService.removeCaja(id);
  }
}
