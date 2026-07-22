import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InsumosService } from './insumos.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { CreateMovimientoInsumoDto } from './dto/create-movimiento-insumo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolUsuario } from '@prisma/client';

@ApiTags('Insumos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insumos')
export class InsumosController {
  constructor(private readonly insumosService: InsumosService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Crear insumo' })
  @ApiResponse({ status: 201, description: 'Insumo creado' })
  @ApiResponse({ status: 409, description: 'Nombre de insumo duplicado' })
  create(@Body() dto: CreateInsumoDto) {
    return this.insumosService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar insumos' })
  @ApiQuery({ name: 'todos', required: false, type: String, description: 'Pasar "true" para incluir inactivos' })
  @ApiResponse({ status: 200, description: 'Lista de insumos' })
  findAll(@Query('todos') todos?: string) {
    return this.insumosService.findAll(todos !== 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener insumo por ID' })
  @ApiResponse({ status: 200, description: 'Insumo encontrado' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.insumosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Actualizar insumo' })
  @ApiResponse({ status: 200, description: 'Insumo actualizado' })
  @ApiResponse({ status: 409, description: 'Nombre de insumo duplicado' })
  update(@Param('id') id: string, @Body() dto: UpdateInsumoDto) {
    return this.insumosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Desactivar insumo (soft delete)' })
  @ApiResponse({ status: 200, description: 'Insumo desactivado' })
  @ApiResponse({ status: 400, description: 'Insumo en uso en la receta de algún producto' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  remove(@Param('id') id: string) {
    return this.insumosService.remove(id);
  }

  @Post(':id/movimientos')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Registrar movimiento de stock del insumo' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado y stock actualizado' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @ApiResponse({ status: 404, description: 'Insumo no encontrado' })
  ajustarStock(
    @Param('id') id: string,
    @Body() dto: CreateMovimientoInsumoDto,
    @CurrentUser() usuario: { id: string },
  ) {
    return this.insumosService.ajustarStock(id, dto, usuario.id);
  }

  @Get(':id/movimientos')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Listar movimientos de stock del insumo' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos' })
  findMovimientos(@Param('id') id: string) {
    return this.insumosService.findMovimientos(id);
  }
}
