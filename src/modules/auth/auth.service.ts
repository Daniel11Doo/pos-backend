import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { LoginDto } from './dto/login.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const SELECT_PERFIL = {
  id: true,
  nombre: true,
  correo: true,
  usuario: true,
  rol: true,
  avatarUrl: true,
  avatarPublicId: true,
  creadoEn: true,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly uploadsService: UploadsService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { OR: [{ usuario: dto.usuario }, { correo: dto.usuario }] },
    });

    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValida = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValida) throw new UnauthorizedException('Credenciales inválidas');

    const payload: JwtPayload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        usuario: usuario.usuario,
        rol: usuario.rol,
        avatarUrl: usuario.avatarUrl,
        avatarPublicId: usuario.avatarPublicId,
      },
    };
  }

  async perfil(usuarioId: string) {
    return this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: SELECT_PERFIL });
  }

  async actualizarPerfil(usuarioId: string, dto: UpdatePerfilDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    if (dto.correo && dto.correo !== usuario.correo) {
      const existe = await this.prisma.usuario.findFirst({ where: { correo: dto.correo, NOT: { id: usuarioId } } });
      if (existe) throw new ConflictException('El correo ya está en uso');
    }

    if (dto.usuario && dto.usuario !== usuario.usuario) {
      const existe = await this.prisma.usuario.findFirst({ where: { usuario: dto.usuario, NOT: { id: usuarioId } } });
      if (existe) throw new ConflictException('Ese nombre de usuario ya está en uso');
    }

    const data: {
      nombre?: string;
      correo?: string;
      usuario?: string;
      password?: string;
      avatarUrl?: string;
      avatarPublicId?: string;
    } = {};
    if (dto.nombre) data.nombre = dto.nombre;
    if (dto.correo) data.correo = dto.correo;
    if (dto.usuario) data.usuario = dto.usuario;

    // Si se sube una nueva foto, eliminar la anterior de Cloudinary
    if (dto.avatarPublicId && usuario.avatarPublicId && dto.avatarPublicId !== usuario.avatarPublicId) {
      await this.uploadsService.deleteImage(usuario.avatarPublicId);
    }
    if (dto.avatarUrl) data.avatarUrl = dto.avatarUrl;
    if (dto.avatarPublicId) data.avatarPublicId = dto.avatarPublicId;

    if (dto.passwordNueva) {
      if (!dto.passwordActual) throw new BadRequestException('Debes indicar tu contraseña actual');
      const passwordValida = await bcrypt.compare(dto.passwordActual, usuario.password);
      if (!passwordValida) throw new BadRequestException('La contraseña actual no es correcta');
      data.password = await bcrypt.hash(dto.passwordNueva, 10);
    }

    return this.prisma.usuario.update({ where: { id: usuarioId }, data, select: SELECT_PERFIL });
  }
}
