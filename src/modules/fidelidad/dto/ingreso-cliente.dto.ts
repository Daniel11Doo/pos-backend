import { Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngresoClienteDto {
  @ApiProperty({ example: '5512345678' })
  @Matches(/^\d{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  telefono: string;
}
