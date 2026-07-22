import { IsString, IsOptional, IsNumber, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInsumoDto {
  @ApiProperty({ example: 'Leche entera' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'ml', description: 'Unidad de medida (ml, g, pza, L, kg...)' })
  @IsString()
  @MinLength(1)
  unidad: string;

  @ApiPropertyOptional({ example: 5000, description: 'Stock inicial' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;
}
