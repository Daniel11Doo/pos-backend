export class UpdateProductoDto {
  nombre?: string;
  descripcion?: string;
  codigoBarras?: string;
  sku?: string;
  precio?: number;
  costo?: number;
  stock?: number;
  activo?: boolean;
  categoriaId?: string;
}
