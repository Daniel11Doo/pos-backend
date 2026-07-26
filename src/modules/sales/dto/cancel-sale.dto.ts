import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelarVentaDto {
  @ApiPropertyOptional({ example: 'El cliente se equivocó de producto' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  motivo?: string;
}
