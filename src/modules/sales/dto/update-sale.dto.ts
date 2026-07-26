import { IsArray, IsEnum, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';
import { ItemVentaDto } from './create-sale.dto';

export class UpdateVentaDto {
  @ApiPropertyOptional({ enum: MetodoPago, example: MetodoPago.EFECTIVO })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

  @ApiProperty({ type: [ItemVentaDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'El ticket debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  items: ItemVentaDto[];
}
