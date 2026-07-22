import { IsNumber, IsPositive, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecetaInsumoDto {
  @ApiProperty({ example: 'uuid-del-insumo' })
  @IsUUID('4', { message: 'insumoId debe ser un UUID válido' })
  insumoId: string;

  @ApiProperty({ example: 200, description: 'Cantidad de insumo consumida por cada unidad vendida' })
  @IsNumber({ maxDecimalPlaces: 3 }, { message: 'La cantidad debe ser un número válido' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;
}
