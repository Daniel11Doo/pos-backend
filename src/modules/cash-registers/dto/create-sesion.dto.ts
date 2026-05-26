export class CreateCajaDto {
  nombre: string;
}

export class AbrirSesionDto {
  cajaId: string;
  montoApertura: number;
}

export class CerrarSesionDto {
  montoCierre: number;
}
