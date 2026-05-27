import { IsArray, IsEnum, IsInt, IsUUID, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';

export class ItemVentaDto {
  @ApiProperty({ example: 'uuid-del-producto' })
  @IsUUID('4')
  productoId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CreateVentaDto {
  @ApiProperty({ example: 'uuid-de-la-sesion' })
  @IsUUID('4')
  sesionCajaId: string;

  @ApiProperty({ enum: MetodoPago, example: MetodoPago.EFECTIVO })
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @ApiProperty({ type: [ItemVentaDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  items: ItemVentaDto[];
}
