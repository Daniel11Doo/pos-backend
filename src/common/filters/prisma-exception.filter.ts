import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

const STATUS_BY_CODE: Record<string, number> = {
  P2002: HttpStatus.CONFLICT,
  P2025: HttpStatus.NOT_FOUND,
  P2003: HttpStatus.CONFLICT,
};

const MESSAGE_BY_CODE: Record<string, string> = {
  P2002: 'Ya existe un registro con ese valor.',
  P2025: 'El registro no existe.',
  P2003: 'No se puede completar la operación porque hay registros relacionados.',
};

// Sin este filtro, un P2002/P2025/P2003 de Prisma llega al cliente como 500
// generico. Traduce los codigos mas comunes a un 4xx legible; el resto de
// PrismaClientKnownRequestError sigue cayendo como 500 (no se ocultan errores
// que si ameritan investigarse).
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = MESSAGE_BY_CODE[exception.code] ?? 'Internal server error';

    response.status(status).json({ statusCode: status, message });
  }
}
