export type RolTipo = 'admin_general' | 'dueño_local' | 'admin_local' | 'admin_asistente';

export type TipoGasto = 
  | 'compra_inventario'
  | 'servicios'
  | 'nomina'
  | 'mantenimiento'
  | 'marketing'
  | 'otros';

export type EstadoPedido = 
  | 'borrador'
  | 'enviado'
  | 'recibido_parcial'
  | 'recibido_completo'
  | 'cancelado';

export type TipoMovimiento = 
  | 'entrada_compra'
  | 'entrada_ajuste'
  | 'salida_venta'
  | 'salida_merma'
  | 'salida_ajuste';

export type TipoAlerta = 
  | 'stock_bajo'
  | 'stock_agotado'
  | 'pedido_grande'
  | 'movimiento_sospechoso'
  | 'sesion_abierta'
  | 'diferencia_caja';

export interface Tienda {
  id: string;
  nombre: string;
  slug: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo_url?: string;
  activa: boolean;
  configuracion: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  telefono?: string;
  avatar_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsuarioTienda {
  id: string;
  usuario_id: string;
  tienda_id: string;
  rol: RolTipo;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Proveedor {
  id: string;
  tienda_id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  tienda_id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Producto {
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
  updated_at: string;
}

export interface Venta {
  id: string;
  tienda_id: string;
  sesion_id?: string;
  usuario_id: string;
  numero_venta: string;
  subtotal: number;
  descuento: number;
  total: number;
  metodo_pago: string;
  estado: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface VentaDetalle {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface Gasto {
  id: string;
  tienda_id: string;
  sesion_id?: string;
  usuario_id: string;
  tipo: TipoGasto;
  concepto: string;
  descripcion?: string;
  monto: number;
  proveedor_id?: string;
  comprobante_url?: string;
  fecha_gasto: string;
  aprobado: boolean;
  aprobado_por?: string;
  fecha_aprobacion?: string;
  created_at: string;
  updated_at: string;
}

export interface Alerta {
  id: string;
  tienda_id: string;
  tipo: TipoAlerta;
  titulo: string;
  mensaje: string;
  producto_id?: string;
  usuario_id?: string;
  referencia_id?: string;
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  leida: boolean;
  created_at: string;
}
