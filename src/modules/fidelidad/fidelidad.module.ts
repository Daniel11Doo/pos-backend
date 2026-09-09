import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { FidelidadController } from './fidelidad.controller';
import { FidelidadService } from './fidelidad.service';

@Module({
  imports: [
    // Solo se usa en /fidelidad/ingreso (via @UseGuards(ThrottlerGuard) ahi)
    // para no dejar abierto a fuerza bruta de numeros de telefono — mismo
    // patron que ThrottlerModule en AuthModule para /auth/login.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 5 }]),
  ],
  controllers: [FidelidadController],
  providers: [FidelidadService],
})
export class FidelidadModule {}
