import { RolUsuario } from '@prisma/client';

export class UpdateUserDto {
  nombre?: string;
  correo?: string;
  password?: string;
  rol?: RolUsuario;
}
