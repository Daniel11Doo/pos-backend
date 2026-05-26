import { RolUsuario } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  correo: string;
  rol: RolUsuario;
}
