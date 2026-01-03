export type RolTipo = 'admin_general' | 'dueño_local' | 'admin_local' | 'admin_asistente';

export type Tienda = {
  id: string;
  nombre: string;
  slug: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo_url?: string;
  activa: boolean;
  created_at: string;
  updated_at: string;
};

export type Usuario = {
  id: string;
  email: string;
  nombre_completo: string;
  telefono?: string;
  avatar_url?: string;
  activo: boolean;
  created_at: string;
};

export type UsuarioTienda = {
  id: string;
  usuario_id: string;
  tienda_id: string;
  rol: RolTipo;
  activo: boolean;
  created_at: string;
};

export type TipoPago = {
  id: string;
  tienda_id?: string;
  nombre: string;
  codigo: 'efectivo' | 'daviplata' | 'nequi' | 'fiado' | 'transferencia' | 'tarjeta';
  descripcion?: string;
  icono?: string;
  color?: string;
  requiere_referencia: boolean;
  es_credito: boolean;
  activo: boolean;
  orden: number;
};

export type Cliente = {
  id: string;
  tienda_id: string;
  nombre_completo: string;
  documento?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  limite_credito: number;
  saldo_pendiente: number;
  notas?: string;
  activo: boolean;
  created_at: string;
};

export type Producto = {
  id: string;
  tienda_id: string;
  categoria_id?: string;
  proveedor_id?: string;
  codigo_barras?: string;
  sku?: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  precio_compra: number;
  precio_venta: number;
  margen_ganancia?: number;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  unidad_medida: string;
  requiere_refrigeracion: boolean;
  perecedero: boolean;
  activo: boolean;
  created_at: string;
};

export type Categoria = {
  id: string;
  tienda_id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  activa: boolean;
};

export type Proveedor = {
  id: string;
  tienda_id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;
};
