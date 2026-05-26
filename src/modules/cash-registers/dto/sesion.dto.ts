import { IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AbrirSesionDto {
  @ApiProperty({ example: 'uuid-de-la-caja' })
  @IsUUID('4')
  cajaId: string;

  @ApiProperty({ example: 500.00, description: 'Monto de apertura en caja' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoApertura: number;
}

export class CerrarSesionDto {
  @ApiProperty({ example: 1250.00, description: 'Monto físico contado al cerrar' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoCierre: number;
}
