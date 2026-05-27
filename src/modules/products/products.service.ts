import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-product.dto';
import { UpdateProductoDto } from './dto/update-product.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async create(dto: CreateProductoDto) {
    await this.validarCategoria(dto.categoriaId);
    await this.validarCamposUnicos(dto.codigoBarras, dto.sku);

    return this.prisma.producto.create({ data: dto, include: { categoria: true } });
  }

  findAll(soloActivos = true) {
    return this.prisma.producto.findMany({
      where: soloActivos ? { activo: true } : undefined,
      include: { categoria: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: { categoria: true },
    });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  async update(id: string, dto: UpdateProductoDto) {
    const producto = await this.findOne(id);

    if (dto.categoriaId) await this.validarCategoria(dto.categoriaId);
    await this.validarCamposUnicos(dto.codigoBarras, dto.sku, id);

    // Si se sube una nueva imagen, eliminar la anterior de Cloudinary
    if (dto.imagenPublicId && producto.imagenPublicId && dto.imagenPublicId !== producto.imagenPublicId) {
      await this.uploadsService.deleteImage(producto.imagenPublicId);
    }

    return this.prisma.producto.update({
      where: { id },
      data: dto,
      include: { categoria: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.producto.update({
      where: { id },
      data: { activo: false },
      include: { categoria: true },
    });
  }

  private async validarCategoria(categoriaId: string) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id: categoriaId } });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');
  }

  private async validarCamposUnicos(codigoBarras?: string, sku?: string, excludeId?: string) {
    if (codigoBarras) {
      const existe = await this.prisma.producto.findFirst({
        where: { codigoBarras, ...(excludeId && { NOT: { id: excludeId } }) },
      });
      if (existe) throw new ConflictException('El código de barras ya está en uso');
    }

    if (sku) {
      const existe = await this.prisma.producto.findFirst({
        where: { sku, ...(excludeId && { NOT: { id: excludeId } }) },
      });
      if (existe) throw new ConflictException('El SKU ya está en uso');
    }
  }
}
