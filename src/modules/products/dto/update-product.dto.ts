import { IsString, IsOptional, IsNumber, IsPositive, IsInt, Min, MinLength, IsUUID, IsBoolean } from 'class-validator';

export class UpdateProductoDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número válido' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  precio?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El costo debe ser un número válido' })
  @Min(0, { message: 'El costo no puede ser negativo' })
  costo?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsUUID('4', { message: 'categoriaId debe ser un UUID válido' })
  categoriaId?: string;
}
