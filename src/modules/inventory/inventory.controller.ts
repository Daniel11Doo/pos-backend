import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolUsuario } from '@prisma/client';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Registrar movimiento de inventario' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado y stock actualizado' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente o producto inactivo' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  create(@Body() dto: CreateMovimientoDto, @CurrentUser() usuario: { id: string }) {
    return this.inventoryService.create(dto, usuario.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Listar movimientos de inventario' })
  @ApiQuery({ name: 'productoId', required: false, description: 'Filtrar por producto' })
  @ApiResponse({ status: 200, description: 'Lista de movimientos' })
  findAll(@Query('productoId') productoId?: string) {
    return this.inventoryService.findAll(productoId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Obtener movimiento por ID' })
  @ApiResponse({ status: 200, description: 'Movimiento encontrado' })
  @ApiResponse({ status: 404, description: 'Movimiento no encontrado' })
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(id);
  }
}
