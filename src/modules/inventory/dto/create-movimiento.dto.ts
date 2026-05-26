import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimientoInventario } from '@prisma/client';

export class CreateMovimientoDto {
  @ApiProperty({ example: 'uuid-del-producto' })
  @IsUUID('4', { message: 'productoId debe ser un UUID válido' })
  productoId: string;

  @ApiProperty({ enum: TipoMovimientoInventario, example: TipoMovimientoInventario.COMPRA })
  @IsEnum(TipoMovimientoInventario)
  tipo: TipoMovimientoInventario;

  @ApiProperty({ example: 50, description: 'Para AJUSTE es el stock absoluto nuevo' })
  @IsInt()
  @Min(0)
  cantidad: number;

  @ApiPropertyOptional({ example: 'Compra a proveedor ABC' })
  @IsOptional()
  @IsString()
  notas?: string;
}
