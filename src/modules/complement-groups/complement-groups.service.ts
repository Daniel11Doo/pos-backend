import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGrupoComplementoDto } from './dto/create-complement-group.dto';
import { UpdateGrupoComplementoDto } from './dto/update-complement-group.dto';

@Injectable()
export class ComplementGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGrupoComplementoDto) {
    const existe = await this.prisma.grupoComplemento.findUnique({ where: { nombre: dto.nombre } });
    if (existe) throw new ConflictException('Ya existe un grupo de complementos con ese nombre');

    return this.prisma.grupoComplemento.create({ data: dto });
  }

  findAll() {
    return this.prisma.grupoComplemento.findMany({
      include: { complementos: { where: { activo: true }, orderBy: { nombre: 'asc' } } },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const grupo = await this.prisma.grupoComplemento.findUnique({
      where: { id },
      include: { complementos: { where: { activo: true }, orderBy: { nombre: 'asc' } } },
    });
    if (!grupo) throw new NotFoundException('Grupo de complementos no encontrado');
    return grupo;
  }

  async update(id: string, dto: UpdateGrupoComplementoDto) {
    await this.findOne(id);

    if (dto.nombre) {
      const existe = await this.prisma.grupoComplemento.findFirst({ where: { nombre: dto.nombre, NOT: { id } } });
      if (existe) throw new ConflictException('Ya existe un grupo de complementos con ese nombre');
    }

    return this.prisma.grupoComplemento.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);

    const enUso =
      (await this.prisma.producto.count({ where: { grupoComplementoId: id } })) +
      (await this.prisma.productoGrupoComplemento.count({ where: { grupoComplementoId: id } }));
    if (enUso > 0) {
      throw new BadRequestException(
        'No se puede eliminar un grupo que tiene complementos o está asignado a algún producto',
      );
    }

    return this.prisma.grupoComplemento.delete({ where: { id } });
  }
}
