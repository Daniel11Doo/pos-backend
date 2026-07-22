import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimientoInventario } from '@prisma/client';

export class CreateMovimientoInsumoDto {
  @ApiProperty({ enum: TipoMovimientoInventario, example: TipoMovimientoInventario.COMPRA })
  @IsEnum(TipoMovimientoInventario)
  tipo: TipoMovimientoInventario;

  @ApiProperty({ example: 5000, description: 'Para AJUSTE es el stock absoluto nuevo' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  cantidad: number;

  @ApiPropertyOptional({ example: 'Compra a proveedor ABC' })
  @IsOptional()
  @IsString()
  notas?: string;
}
