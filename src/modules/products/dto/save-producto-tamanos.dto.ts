import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  MinLength,
  IsUUID,
  IsUrl,
  IsArray,
  IsIn,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecetaInsumoDto } from './receta-insumo.dto';
import { GrupoComplementoAplicableDto } from './grupo-complemento-aplicable.dto';

const TAMANOS_VALIDOS = ['Chico', 'Mediano', 'Grande'] as const;

export class TamanoProductoDto {
  @ApiProperty({ example: 'Grande', enum: TAMANOS_VALIDOS })
  @IsIn(TAMANOS_VALIDOS, { message: 'size debe ser Chico, Mediano o Grande' })
  size: (typeof TAMANOS_VALIDOS)[number];

  @ApiProperty({ example: 65.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número válido' },
  )
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  precio: number;

  @ApiPropertyOptional({
    example: 'uuid-del-producto',
    description:
      'Si ya existe un producto para este tamaño, se actualiza; si no, se crea uno nuevo',
  })
  @IsOptional()
  @IsUUID('4', { message: 'productoId debe ser un UUID válido' })
  productoId?: string;
}

export class SaveProductoTamanosDto {
  @ApiProperty({
    example: 'Pastel de Chocolate',
    description: 'Nombre base, sin el sufijo del tamaño',
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Relleno de ganache' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 35.0 })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El costo debe ser un número válido' },
  )
  @Min(0, { message: 'El costo no puede ser negativo' })
  costo: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;

  @ApiProperty({ example: 'uuid-de-la-categoria' })
  @IsUUID('4', { message: 'categoriaId debe ser un UUID válido' })
  categoriaId: string;

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
    description: 'Receta opcional: se aplica igual a todos los tamaños',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaInsumoDto)
  insumos?: RecetaInsumoDto[];

  @ApiPropertyOptional({
    example: 'uuid-del-grupo',
    description:
      'Si ESTOS productos son un complemento, a qué grupo pertenecen',
  })
  @IsOptional()
  @IsUUID('4', { message: 'grupoComplementoId debe ser un UUID válido' })
  grupoComplementoId?: string;

  @ApiPropertyOptional({
    type: [GrupoComplementoAplicableDto],
    description:
      'Grupos de complementos aplicables, iguales para todos los tamaños',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrupoComplementoAplicableDto)
  gruposComplemento?: GrupoComplementoAplicableDto[];

  @ApiProperty({
    type: [TamanoProductoDto],
    description: 'Tamaños a crear/actualizar (mínimo 1, máximo 3, sin repetir)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Marca al menos un tamaño' })
  @ArrayMaxSize(3, { message: 'Solo puede haber Chico, Mediano y Grande' })
  @ValidateNested({ each: true })
  @Type(() => TamanoProductoDto)
  tamanos: TamanoProductoDto[];

  @ApiPropertyOptional({
    type: [String],
    description:
      'IDs de productos de tamaños que se desmarcaron y deben desactivarse',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: 'desactivarIds debe contener UUIDs válidos',
  })
  desactivarIds?: string[];
}
