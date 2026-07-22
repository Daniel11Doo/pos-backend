import { IsEmail, IsOptional, IsString, IsUrl, MinLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePerfilDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ example: 'juan@pos.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Correo inválido' })
  correo?: string;

  @ApiPropertyOptional({ example: 'juanperez' })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  usuario?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...' })
  @IsOptional()
  @IsUrl({}, { message: 'avatarUrl debe ser una URL válida' })
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'pos/avatars/abc123' })
  @IsOptional()
  @IsString()
  avatarPublicId?: string;

  @ApiPropertyOptional({ example: 'nuevo123', description: 'Nueva contraseña (requiere passwordActual)' })
  @ValidateIf((dto) => Boolean(dto.passwordNueva))
  @IsString()
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  passwordNueva?: string;

  @ApiPropertyOptional({ example: 'actual123', description: 'Contraseña actual, requerida para cambiarla' })
  @ValidateIf((dto) => Boolean(dto.passwordNueva))
  @IsString()
  passwordActual?: string;
}
