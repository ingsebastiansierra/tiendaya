-- ============================================
-- ESQUEMA MULTI-TIENDA CON ANTIFRAUDE
-- Sistema de Tipos de Pago: Efectivo, Daviplata, Nequi, Fiado
-- ============================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. TIENDAS (Multi-tenant base)
-- ============================================
CREATE TABLE tiendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  logo_url TEXT,
  activa BOOLEAN DEFAULT true,
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tiendas_slug ON tiendas(slug);
CREATE INDEX idx_tiendas_activa ON tiendas(activa);

-- ============================================
-- 2. ROLES Y PERMISOS
-- ============================================
CREATE TYPE rol_tipo AS ENUM (
  'admin_general',
  'dueño_local',
  'admin_local',
  'admin_asistente'
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  avatar_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usuarios_tiendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  rol rol_tipo NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, tienda_id)
);

CREATE INDEX idx_usuarios_tiendas_usuario ON usuarios_tiendas(usuario_id);
CREATE INDEX idx_usuarios_tiendas_tienda ON usuarios_tiendas(tienda_id);

-- ============================================
-- 3. PROVEEDORES
-- ============================================
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  contacto VARCHAR(255),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proveedores_tienda ON proveedores(tienda_id);

-- ============================================
-- 4. CATEGORÍAS Y PRODUCTOS
-- ============================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50),
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categorias_tienda ON categorias(tienda_id);

CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  codigo_barras VARCHAR(100),
  sku VARCHAR(100),
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_venta DECIMAL(10,2) NOT NULL,
  margen_ganancia DECIMAL(5,2),
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  stock_maximo INTEGER NOT NULL DEFAULT 0,
  unidad_medida VARCHAR(50) DEFAULT 'unidad',
  requiere_refrigeracion BOOLEAN DEFAULT false,
  perecedero BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT stock_minimo_valido CHECK (stock_minimo >= 0),
  CONSTRAINT stock_maximo_valido CHECK (stock_maximo >= stock_minimo),
  CONSTRAINT precio_venta_valido CHECK (precio_venta > 0)
);

CREATE INDEX idx_productos_tienda ON productos(tienda_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX idx_productos_stock_bajo ON productos(tienda_id, stock_actual) 
  WHERE stock_actual <= stock_minimo;

-- ============================================
-- 5. TIPOS DE PAGO
-- ============================================
CREATE TABLE tipos_pago (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50),
  color VARCHAR(20),
  requiere_referencia BOOLEAN DEFAULT false,
  es_credito BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tienda_id, codigo)
);

CREATE INDEX idx_tipos_pago_tienda ON tipos_pago(tienda_id);
CREATE INDEX idx_tipos_pago_activo ON tipos_pago(activo);

-- Insertar tipos de pago por defecto (globales)
INSERT INTO tipos_pago (nombre, codigo, descripcion, icono, color, requiere_referencia, es_credito, orden) VALUES
  ('Efectivo', 'efectivo', 'Pago en efectivo', 'cash', '#10B981', false, false, 1),
  ('Daviplata', 'daviplata', 'Pago por Daviplata', 'phone', '#FF0000', true, false, 2),
  ('Nequi', 'nequi', 'Pago por Nequi', 'phone', '#FF006B', true, false, 3),
  ('Fiado', 'fiado', 'Venta a crédito', 'credit-card', '#F59E0B', false, true, 4),
  ('Transferencia', 'transferencia', 'Transferencia bancaria', 'bank', '#3B82F6', true, false, 5),
  ('Tarjeta', 'tarjeta', 'Tarjeta débito/crédito', 'credit-card', '#8B5CF6', true, false, 6);

-- ============================================
-- 6. CLIENTES (Para fiados y créditos)
-- ============================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(255) NOT NULL,
  documento VARCHAR(50),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  limite_credito DECIMAL(10,2) DEFAULT 0,
  saldo_pendiente DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clientes_tienda ON clientes(tienda_id);
CREATE INDEX idx_clientes_documento ON clientes(documento);
CREATE INDEX idx_clientes_saldo ON clientes(saldo_pendiente) WHERE saldo_pendiente > 0;

-- ============================================
-- 7. SESIONES Y VENTAS
-- ============================================
CREATE TABLE sesiones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  efectivo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  efectivo_final DECIMAL(10,2),
  efectivo_esperado DECIMAL(10,2),
  diferencia DECIMAL(10,2),
  total_ventas DECIMAL(10,2) DEFAULT 0,
  total_gastos DECIMAL(10,2) DEFAULT 0,
  cerrada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sesiones_tienda ON sesiones(tienda_id);
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);

CREATE TABLE ventas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  sesion_id UUID REFERENCES sesiones(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  cliente_id UUID REFERENCES clientes(id),
  numero_venta VARCHAR(50) UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  tipo_pago_id UUID NOT NULL REFERENCES tipos_pago(id),
  referencia_pago VARCHAR(100),
  estado VARCHAR(50) DEFAULT 'completada',
  pagada BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ventas_tienda ON ventas(tienda_id);
CREATE INDEX idx_ventas_sesion ON ventas(sesion_id);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_tipo_pago ON ventas(tipo_pago_id);
CREATE INDEX idx_ventas_fecha ON ventas(created_at);
CREATE INDEX idx_ventas_pagada ON ventas(pagada) WHERE pagada = false;

CREATE TABLE ventas_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ventas_detalle_venta ON ventas_detalle(venta_id);

-- ============================================
-- 8. PAGOS DE FIADOS (Abonos a créditos)
-- ============================================
CREATE TABLE pagos_fiados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  monto DECIMAL(10,2) NOT NULL,
  tipo_pago_id UUID NOT NULL REFERENCES tipos_pago(id),
  referencia_pago VARCHAR(100),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pagos_fiados_tienda ON pagos_fiados(tienda_id);
CREATE INDEX idx_pagos_fiados_venta ON pagos_fiados(venta_id);
CREATE INDEX idx_pagos_fiados_cliente ON pagos_fiados(cliente_id);

-- ============================================
-- 9. GASTOS
-- ============================================
CREATE TYPE tipo_gasto AS ENUM (
  'compra_inventario',
  'servicios',
  'nomina',
  'mantenimiento',
  'marketing',
  'otros'
);

CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  sesion_id UUID REFERENCES sesiones(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo tipo_gasto NOT NULL,
  concepto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  monto DECIMAL(10,2) NOT NULL,
  proveedor_id UUID REFERENCES proveedores(id),
  fecha_gasto DATE DEFAULT CURRENT_DATE,
  aprobado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gastos_tienda ON gastos(tienda_id);
CREATE INDEX idx_gastos_fecha ON gastos(fecha_gasto);

-- ============================================
-- 10. PEDIDOS A PROVEEDORES
-- ============================================
CREATE TYPE estado_pedido AS ENUM (
  'borrador',
  'enviado',
  'recibido_parcial',
  'recibido_completo',
  'cancelado'
);

CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  estado estado_pedido DEFAULT 'borrador',
  fecha_pedido DATE DEFAULT CURRENT_DATE,
  fecha_entrega_estimada DATE,
  total DECIMAL(10,2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pedidos_tienda ON pedidos(tienda_id);
CREATE INDEX idx_pedidos_proveedor ON pedidos(proveedor_id);

CREATE TABLE pedidos_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  cantidad_solicitada INTEGER NOT NULL,
  cantidad_recibida INTEGER DEFAULT 0,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pedidos_detalle_pedido ON pedidos_detalle(pedido_id);

-- ============================================
-- 11. ALERTAS
-- ============================================
CREATE TYPE tipo_alerta AS ENUM (
  'stock_bajo',
  'stock_agotado',
  'pedido_grande',
  'movimiento_sospechoso',
  'sesion_abierta',
  'diferencia_caja'
);

CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  tipo tipo_alerta NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  producto_id UUID REFERENCES productos(id),
  prioridad VARCHAR(20) DEFAULT 'media',
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alertas_tienda ON alertas(tienda_id);
CREATE INDEX idx_alertas_leida ON alertas(leida);

-- ============================================
-- 12. MOVIMIENTOS DE INVENTARIO
-- ============================================
CREATE TYPE tipo_movimiento AS ENUM (
  'entrada_compra',
  'entrada_ajuste',
  'salida_venta',
  'salida_merma',
  'salida_ajuste'
);

CREATE TABLE movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo tipo_movimiento NOT NULL,
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  referencia_id UUID,
  referencia_tipo VARCHAR(50),
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movimientos_tienda ON movimientos_inventario(tienda_id);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);

-- ============================================
-- 13. LOGS DE AUDITORÍA
-- ============================================
CREATE TABLE logs_auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tienda_id UUID REFERENCES tiendas(id),
  usuario_id UUID REFERENCES usuarios(id),
  accion VARCHAR(100) NOT NULL,
  tabla VARCHAR(100) NOT NULL,
  registro_id UUID,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_tienda ON logs_auditoria(tienda_id);
CREATE INDEX idx_logs_fecha ON logs_auditoria(created_at);

-- ============================================
-- TRIGGERS Y FUNCIONES
-- ============================================

-- Actualizar stock al vender
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos 
  SET stock_actual = stock_actual - NEW.cantidad,
      updated_at = NOW()
  WHERE id = NEW.producto_id;
  
  INSERT INTO movimientos_inventario (
    tienda_id, producto_id, usuario_id, tipo,
    cantidad, stock_anterior, stock_nuevo,
    referencia_id, referencia_tipo
  )
  SELECT 
    p.tienda_id,
    NEW.producto_id,
    v.usuario_id,
    'salida_venta',
    NEW.cantidad,
    p.stock_actual + NEW.cantidad,
    p.stock_actual,
    NEW.venta_id,
    'venta'
  FROM productos p
  JOIN ventas v ON v.id = NEW.venta_id
  WHERE p.id = NEW.producto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock_venta
  AFTER INSERT ON ventas_detalle
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_stock_venta();

-- Crear alerta de stock bajo
CREATE OR REPLACE FUNCTION verificar_stock_bajo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock_actual = 0 THEN
    INSERT INTO alertas (tienda_id, tipo, titulo, mensaje, producto_id, prioridad)
    VALUES (
      NEW.tienda_id,
      'stock_agotado',
      'Producto agotado',
      'El producto "' || NEW.nombre || '" se ha agotado',
      NEW.id,
      'critica'
    );
  ELSIF NEW.stock_actual <= NEW.stock_minimo THEN
    INSERT INTO alertas (tienda_id, tipo, titulo, mensaje, producto_id, prioridad)
    VALUES (
      NEW.tienda_id,
      'stock_bajo',
      'Stock bajo',
      'El producto "' || NEW.nombre || '" está por debajo del stock mínimo',
      NEW.id,
      'alta'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_verificar_stock_bajo
  AFTER UPDATE OF stock_actual ON productos
  FOR EACH ROW
  WHEN (OLD.stock_actual IS DISTINCT FROM NEW.stock_actual)
  EXECUTE FUNCTION verificar_stock_bajo();

-- Actualizar saldo de cliente al crear venta fiada
CREATE OR REPLACE FUNCTION actualizar_saldo_cliente_venta()
RETURNS TRIGGER AS $$
DECLARE
  v_es_credito BOOLEAN;
BEGIN
  SELECT es_credito INTO v_es_credito
  FROM tipos_pago
  WHERE id = NEW.tipo_pago_id;
  
  IF v_es_credito AND NEW.cliente_id IS NOT NULL THEN
    UPDATE clientes
    SET saldo_pendiente = saldo_pendiente + NEW.total,
        updated_at = NOW()
    WHERE id = NEW.cliente_id;
    
    PERFORM verificar_limite_credito(NEW.cliente_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_saldo_cliente_venta
  AFTER INSERT ON ventas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_saldo_cliente_venta();

-- Actualizar saldo de cliente al registrar pago de fiado
CREATE OR REPLACE FUNCTION actualizar_saldo_cliente_pago()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clientes
  SET saldo_pendiente = saldo_pendiente - NEW.monto,
      updated_at = NOW()
  WHERE id = NEW.cliente_id;
  
  PERFORM verificar_venta_pagada(NEW.venta_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_saldo_cliente_pago
  AFTER INSERT ON pagos_fiados
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_saldo_cliente_pago();

-- Verificar límite de crédito
CREATE OR REPLACE FUNCTION verificar_limite_credito(p_cliente_id UUID)
RETURNS VOID AS $$
DECLARE
  v_cliente RECORD;
BEGIN
  SELECT * INTO v_cliente
  FROM clientes
  WHERE id = p_cliente_id;
  
  IF v_cliente.saldo_pendiente > v_cliente.limite_credito THEN
    INSERT INTO alertas (tienda_id, tipo, titulo, mensaje, prioridad)
    VALUES (
      v_cliente.tienda_id,
      'movimiento_sospechoso',
      'Límite de crédito excedido',
      'El cliente "' || v_cliente.nombre_completo || '" ha excedido su límite de crédito',
      'alta'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Verificar si una venta fiada quedó completamente pagada
CREATE OR REPLACE FUNCTION verificar_venta_pagada(p_venta_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_venta DECIMAL(10,2);
  v_total_pagado DECIMAL(10,2);
BEGIN
  SELECT total INTO v_total_venta
  FROM ventas
  WHERE id = p_venta_id;
  
  SELECT COALESCE(SUM(monto), 0) INTO v_total_pagado
  FROM pagos_fiados
  WHERE venta_id = p_venta_id;
  
  IF v_total_pagado >= v_total_venta THEN
    UPDATE ventas
    SET pagada = true,
        updated_at = NOW()
    WHERE id = p_venta_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_fiados ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para verificar acceso a tienda
CREATE OR REPLACE FUNCTION tiene_acceso_tienda(p_tienda_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM usuarios_tiendas 
    WHERE usuario_id = auth.uid() 
      AND tienda_id = p_tienda_id 
      AND activo = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Políticas para productos
CREATE POLICY "usuarios_productos_select" ON productos
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "usuarios_productos_insert" ON productos
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

CREATE POLICY "usuarios_productos_update" ON productos
  FOR UPDATE
  USING (tiene_acceso_tienda(tienda_id));

-- Políticas para ventas
CREATE POLICY "usuarios_ventas_select" ON ventas
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "usuarios_ventas_insert" ON ventas
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

-- Políticas para alertas
CREATE POLICY "usuarios_alertas_select" ON alertas
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

-- Políticas para tipos de pago
CREATE POLICY "usuarios_tipos_pago_select" ON tipos_pago
  FOR SELECT
  USING (tienda_id IS NULL OR tiene_acceso_tienda(tienda_id));

-- Políticas para clientes
CREATE POLICY "usuarios_clientes_select" ON clientes
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "usuarios_clientes_insert" ON clientes
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

CREATE POLICY "usuarios_clientes_update" ON clientes
  FOR UPDATE
  USING (tiene_acceso_tienda(tienda_id));

-- Políticas para pagos de fiados
CREATE POLICY "usuarios_pagos_fiados_select" ON pagos_fiados
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "usuarios_pagos_fiados_insert" ON pagos_fiados
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

-- ============================================
-- DATOS DE EJEMPLO
-- ============================================

-- Insertar tienda de ejemplo
INSERT INTO tiendas (nombre, slug, direccion, telefono, email)
VALUES ('Tienda Principal', 'tienda-principal', 'Calle 123 #45-67', '3001234567', 'tienda@example.com');
