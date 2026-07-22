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

  private static readonly INCLUDE = {
    categoria: true,
    insumos: { include: { insumo: true } },
    grupoComplemento: true,
    gruposComplementoAplicables: { include: { grupoComplemento: true } },
  };

  async create(dto: CreateProductoDto) {
    await this.validarCategoria(dto.categoriaId);
    await this.validarCamposUnicos(dto.codigoBarras, dto.sku);

    const { insumos, gruposComplemento, ...data } = dto;
    if (insumos?.length) await this.validarInsumos(insumos.map((i) => i.insumoId));
    if (gruposComplemento?.length) await this.validarGruposComplemento(gruposComplemento.map((g) => g.grupoComplementoId));

    return this.prisma.producto.create({
      data: {
        ...data,
        ...(insumos?.length && {
          insumos: { create: insumos.map((i) => ({ cantidad: i.cantidad, insumoId: i.insumoId })) },
        }),
        ...(gruposComplemento?.length && {
          gruposComplementoAplicables: {
            create: gruposComplemento.map((g) => ({
              grupoComplementoId: g.grupoComplementoId,
              incluidosGratis: g.incluidosGratis ?? 0,
            })),
          },
        }),
      },
      include: ProductsService.INCLUDE,
    });
  }

  findAll(soloActivos = true) {
    return this.prisma.producto.findMany({
      where: soloActivos ? { activo: true } : undefined,
      include: ProductsService.INCLUDE,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: ProductsService.INCLUDE,
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

    const { insumos, gruposComplemento, ...data } = dto;
    if (insumos) await this.validarInsumos(insumos.map((i) => i.insumoId));
    if (gruposComplemento) await this.validarGruposComplemento(gruposComplemento.map((g) => g.grupoComplementoId));

    return this.prisma.$transaction(async (tx) => {
      if (insumos) {
        await tx.productoInsumo.deleteMany({ where: { productoId: id } });
        if (insumos.length) {
          await tx.productoInsumo.createMany({
            data: insumos.map((i) => ({ productoId: id, insumoId: i.insumoId, cantidad: i.cantidad })),
          });
        }
      }

      if (gruposComplemento) {
        await tx.productoGrupoComplemento.deleteMany({ where: { productoId: id } });
        if (gruposComplemento.length) {
          await tx.productoGrupoComplemento.createMany({
            data: gruposComplemento.map((g) => ({
              productoId: id,
              grupoComplementoId: g.grupoComplementoId,
              incluidosGratis: g.incluidosGratis ?? 0,
            })),
          });
        }
      }

      return tx.producto.update({ where: { id }, data, include: ProductsService.INCLUDE });
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

  private async validarInsumos(insumoIds: string[]) {
    const unicos = [...new Set(insumoIds)];
    if (unicos.length !== insumoIds.length) {
      throw new ConflictException('No repitas el mismo insumo en la receta');
    }

    const encontrados = await this.prisma.insumo.findMany({ where: { id: { in: unicos } } });
    if (encontrados.length !== unicos.length) {
      throw new NotFoundException('Uno o más insumos de la receta no existen');
    }
  }

  private async validarGruposComplemento(grupoIds: string[]) {
    const unicos = [...new Set(grupoIds)];
    if (unicos.length !== grupoIds.length) {
      throw new ConflictException('No repitas el mismo grupo de complementos');
    }

    const encontrados = await this.prisma.grupoComplemento.findMany({ where: { id: { in: unicos } } });
    if (encontrados.length !== unicos.length) {
      throw new NotFoundException('Uno o más grupos de complementos no existen');
    }
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
