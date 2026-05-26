import { IsString, IsOptional, IsNumber, IsPositive, IsInt, Min, MinLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ example: 'Coca-Cola 600ml' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre: string;

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

  @ApiProperty({ example: 18.00 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser un número válido' })
  @IsPositive({ message: 'El precio debe ser mayor a 0' })
  precio: number;

  @ApiProperty({ example: 10.50 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El costo debe ser un número válido' })
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
}
