import { RolUsuario } from '@prisma/client';

export class CreateUserDto {
  nombre: string;
  correo: string;
  password: string;
  rol?: RolUsuario;
}
