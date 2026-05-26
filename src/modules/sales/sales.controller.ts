import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateVentaDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolUsuario } from '@prisma/client';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar venta' })
  @ApiResponse({ status: 201, description: 'Venta creada, stock descontado y movimiento de caja registrado' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente, producto inactivo o sesión cerrada' })
  @ApiResponse({ status: 404, description: 'Sesión o producto no encontrado' })
  create(@Body() dto: CreateVentaDto, @CurrentUser() usuario: { id: string }) {
    return this.salesService.create(dto, usuario.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Listar todas las ventas' })
  @ApiResponse({ status: 200, description: 'Lista de ventas' })
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener venta por ID' })
  @ApiResponse({ status: 200, description: 'Venta encontrada con sus items' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Cancelar venta' })
  @ApiResponse({ status: 200, description: 'Venta cancelada y stock restaurado' })
  @ApiResponse({ status: 400, description: 'Solo se pueden cancelar ventas completadas' })
  cancelar(@Param('id') id: string, @CurrentUser() usuario: { id: string }) {
    return this.salesService.cancelar(id, usuario.id);
  }

  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Reembolsar venta' })
  @ApiResponse({ status: 200, description: 'Venta reembolsada, stock restaurado y movimiento de caja registrado' })
  @ApiResponse({ status: 400, description: 'Solo se pueden reembolsar ventas completadas' })
  reembolsar(@Param('id') id: string, @CurrentUser() usuario: { id: string }) {
    return this.salesService.reembolsar(id, usuario.id);
  }
}
