import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Correo inválido' })
  correo?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
