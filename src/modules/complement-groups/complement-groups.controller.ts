import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ComplementGroupsService } from './complement-groups.service';
import { CreateGrupoComplementoDto } from './dto/create-complement-group.dto';
import { UpdateGrupoComplementoDto } from './dto/update-complement-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '@prisma/client';

@ApiTags('Complement Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('complement-groups')
export class ComplementGroupsController {
  constructor(private readonly complementGroupsService: ComplementGroupsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Crear grupo de complementos' })
  @ApiResponse({ status: 201, description: 'Grupo creado' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  create(@Body() dto: CreateGrupoComplementoDto) {
    return this.complementGroupsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar grupos de complementos con sus productos' })
  @ApiResponse({ status: 200, description: 'Lista de grupos' })
  findAll() {
    return this.complementGroupsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener grupo de complementos por ID' })
  @ApiResponse({ status: 200, description: 'Grupo encontrado' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  findOne(@Param('id') id: string) {
    return this.complementGroupsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Actualizar grupo de complementos' })
  @ApiResponse({ status: 200, description: 'Grupo actualizado' })
  @ApiResponse({ status: 409, description: 'Nombre duplicado' })
  update(@Param('id') id: string, @Body() dto: UpdateGrupoComplementoDto) {
    return this.complementGroupsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.GERENTE)
  @ApiOperation({ summary: 'Eliminar grupo de complementos' })
  @ApiResponse({ status: 200, description: 'Grupo eliminado' })
  @ApiResponse({ status: 400, description: 'Grupo en uso' })
  @ApiResponse({ status: 404, description: 'Grupo no encontrado' })
  remove(@Param('id') id: string) {
    return this.complementGroupsService.remove(id);
  }
}
