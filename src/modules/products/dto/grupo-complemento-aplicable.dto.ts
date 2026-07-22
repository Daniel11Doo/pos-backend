import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GrupoComplementoAplicableDto {
  @ApiProperty({ example: 'uuid-del-grupo' })
  @IsUUID('4', { message: 'grupoComplementoId debe ser un UUID válido' })
  grupoComplementoId: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Cuántas unidades de este grupo vienen incluidas sin costo (ej. 1 topping gratis)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  incluidosGratis?: number;
}
