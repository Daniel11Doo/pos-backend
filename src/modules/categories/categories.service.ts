import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-category.dto';
import { UpdateCategoriaDto } from './dto/update-category.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async create(dto: CreateCategoriaDto) {
    const existe = await this.prisma.categoria.findUnique({ where: { nombre: dto.nombre } });
    if (existe) throw new ConflictException('Ya existe una categoría con ese nombre');

    return this.prisma.categoria.create({ data: dto });
  }

  findAll() {
    return this.prisma.categoria.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
    return categoria;
  }

  async update(id: string, dto: UpdateCategoriaDto) {
    const categoria = await this.findOne(id);

    if (dto.nombre) {
      const existe = await this.prisma.categoria.findFirst({
        where: { nombre: dto.nombre, NOT: { id } },
      });
      if (existe) throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    // Si se sube una nueva imagen, eliminar la anterior de Cloudinary
    if (dto.imagenPublicId && categoria.imagenPublicId && dto.imagenPublicId !== categoria.imagenPublicId) {
      await this.uploadsService.deleteImage(categoria.imagenPublicId);
    }

    return this.prisma.categoria.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const categoria = await this.findOne(id);

    const tieneProductos = await this.prisma.producto.count({ where: { categoriaId: id } });
    if (tieneProductos > 0) {
      throw new BadRequestException('No se puede eliminar una categoría con productos asociados');
    }

    if (categoria.imagenPublicId) {
      await this.uploadsService.deleteImage(categoria.imagenPublicId);
    }

    return this.prisma.categoria.delete({ where: { id } });
  }
}
