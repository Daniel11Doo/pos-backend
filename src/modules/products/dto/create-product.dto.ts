export class CreateProductoDto {
  nombre: string;
  descripcion?: string;
  codigoBarras?: string;
  sku?: string;
  precio: number;
  costo: number;
  stock?: number;
  categoriaId: string;
}
