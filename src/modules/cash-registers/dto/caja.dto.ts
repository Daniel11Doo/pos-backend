import { IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCajaDto {
  @ApiProperty({ example: 'Caja 1' })
  @IsString()
  @MinLength(2)
  nombre: string;
}

export class UpdateCajaDto {
  @ApiPropertyOptional({ example: 'Caja Principal' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
