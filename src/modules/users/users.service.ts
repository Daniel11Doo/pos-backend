import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SELECT_USUARIO = {
  id: true,
  nombre: true,
  correo: true,
  rol: true,
  activo: true,
  creadoEn: true,
  actualizadoEn: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existe = await this.prisma.usuario.findUnique({ where: { correo: dto.correo } });
    if (existe) throw new ConflictException('El correo ya está registrado');

    const password = await bcrypt.hash(dto.password, 10);
    return this.prisma.usuario.create({
      data: { ...dto, password },
      select: SELECT_USUARIO,
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({ select: SELECT_USUARIO });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: SELECT_USUARIO,
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.correo) {
      const existe = await this.prisma.usuario.findFirst({
        where: { correo: dto.correo, NOT: { id } },
      });
      if (existe) throw new ConflictException('El correo ya está en uso');
    }

    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: SELECT_USUARIO,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.usuario.delete({ where: { id }, select: SELECT_USUARIO });
  }
}
