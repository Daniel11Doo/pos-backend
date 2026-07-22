import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  MinLength,
  IsUUID,
  IsBoolean,
  IsUrl,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecetaInsumoDto } from './receta-insumo.dto';
import { GrupoComplementoAplicableDto } from './grupo-complemento-aplicable.dto';

export class UpdateProductoDto {
  @ApiPropertyOptional({ example: 'Coca-Cola 600ml' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ example: 'Refresco de cola 600ml' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: '7501055300051' })
  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @ApiPropertyOptional({ example: 'COC-600' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 18.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número válido' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  precio?: number;

  @ApiPropertyOptional({ example: 10.50 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El costo debe ser un número válido' })
  @Min(0, { message: 'El costo no puede ser negativo' })
  costo?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @ApiPropertyOptional({ example: 'uuid-de-la-categoria' })
  @IsOptional()
  @IsUUID('4', { message: 'categoriaId debe ser un UUID válido' })
  categoriaId?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsUrl({}, { message: 'imagenUrl debe ser una URL válida' })
  imagenUrl?: string;

  @ApiPropertyOptional({ example: 'pos/products/abc123' })
  @IsOptional()
  @IsString()
  imagenPublicId?: string;

  @ApiPropertyOptional({
    type: [RecetaInsumoDto],
    description: 'Receta opcional: reemplaza por completo los insumos asignados a este producto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaInsumoDto)
  insumos?: RecetaInsumoDto[];

  @ApiPropertyOptional({
    example: 'uuid-del-grupo',
    description: 'Si ESTE producto es un complemento (ej. un cold foam), a qué grupo pertenece',
  })
  @IsOptional()
  @IsUUID('4', { message: 'grupoComplementoId debe ser un UUID válido' })
  grupoComplementoId?: string;

  @ApiPropertyOptional({
    type: [GrupoComplementoAplicableDto],
    description: 'Reemplaza por completo los grupos de complementos aplicables a este producto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrupoComplementoAplicableDto)
  gruposComplemento?: GrupoComplementoAplicableDto[];
}
