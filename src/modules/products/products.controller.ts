import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductoDto } from './dto/create-product.dto';
import { UpdateProductoDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '@prisma/client';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Crear producto' })
  @ApiResponse({ status: 201, description: 'Producto creado' })
  @ApiResponse({ status: 409, description: 'Código de barras o SKU duplicado' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  create(@Body() dto: CreateProductoDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'todos', required: false, type: String, description: 'Pasar "true" para incluir inactivos' })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  findAll(@Query('todos') todos?: string) {
    return this.productsService.findAll(todos !== 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({ status: 404, description: 'Producto o categoría no encontrada' })
  @ApiResponse({ status: 409, description: 'Código de barras o SKU duplicado' })
  update(@Param('id') id: string, @Body() dto: UpdateProductoDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Desactivar producto (soft delete)' })
  @ApiResponse({ status: 200, description: 'Producto desactivado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
