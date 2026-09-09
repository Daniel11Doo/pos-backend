import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConfiguracionFidelidadDto {
  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Debe requerir al menos 1 sello' })
  sellosParaRecompensa?: number;

  @ApiPropertyOptional({ example: 'Postre gratis' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'La descripción debe tener al menos 2 caracteres' })
  descripcionRecompensa?: string;
}
