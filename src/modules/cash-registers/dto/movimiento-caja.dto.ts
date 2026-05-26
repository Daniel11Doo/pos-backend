import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimientoCaja } from '@prisma/client';

const TIPOS_MANUALES = [
  TipoMovimientoCaja.INGRESO,
  TipoMovimientoCaja.GASTO,
  TipoMovimientoCaja.RETIRO,
  TipoMovimientoCaja.REEMBOLSO,
] as const;

export class CreateMovimientoCajaDto {
  @ApiProperty({ enum: TIPOS_MANUALES, example: TipoMovimientoCaja.INGRESO })
  @IsEnum(TIPOS_MANUALES, { message: 'Tipo inválido. Use INGRESO, GASTO, RETIRO o REEMBOLSO' })
  tipo: (typeof TIPOS_MANUALES)[number];

  @ApiProperty({ example: 200.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  monto: number;

  @ApiPropertyOptional({ example: 'Pago a proveedor' })
  @IsOptional()
  @IsString()
  notas?: string;
}
