import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  nombre: string;

  @ApiProperty({ example: 'juan@pos.com' })
  @IsEmail({}, { message: 'Correo inválido' })
  correo: string;

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiPropertyOptional({ enum: RolUsuario, example: RolUsuario.CAJERO })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;
}
