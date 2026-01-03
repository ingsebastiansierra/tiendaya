-- ============================================
-- DATOS DE PRUEBA COMPLETOS
-- Ejecutar después del schema principal
-- ============================================

-- NOTA: Reemplaza los UUIDs según tu configuración

-- ============================================
-- 1. CREAR TIENDA DE PRUEBA
-- ============================================

-- Insertar tienda
INSERT INTO tiendas (id, nombre, slug, direccion, telefono, email)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Tienda Demo',
  'tienda-demo',
  'Calle 123 #45-67, Bogotá',
  '3001234567',
  'demo@tiendamulti.com'
);

-- ============================================
-- 2. CREAR USUARIOS DE PRUEBA
-- ============================================

-- IMPORTANTE: Primero crear usuarios en Supabase Auth UI
-- Luego ejecutar estos inserts con los IDs correctos

-- Ejemplo de insert (reemplazar con IDs reales de auth.users)
/*
INSERT INTO usuarios (id, email, nombre_completo, telefono)
VALUES 
  ('user-id-from-auth', 'admin@demo.com', 'Admin Demo', '3001111111'),
  ('user-id-from-auth-2', 'vendedor@demo.com', 'Vendedor Demo', '3002222222');

-- Asociar usuarios a tienda
INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol)
VALUES
  ('user-id-from-auth', '00000000-0000-0000-0000-000000000001', 'admin_general'),
  ('user-id-from-auth-2', '00000000-0000-0000-0000-000000000001', 'admin_local');
*/

-- ============================================
-- 3. CREAR PROVEEDORES
-- ============================================

INSERT INTO proveedores (id, tienda_id, nombre, contacto, telefono, email)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
   'Distribuidora ABC', 'Juan Pérez', '3101234567', 'ventas@abc.com'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'Papelería Central', 'María García', '3209876543', 'info@papeleria.com'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   'Bebidas del Valle', 'Carlos López', '3158765432', 'pedidos@bebidas.com');

-- ============================================
-- 4. CREAR CATEGORÍAS
-- ============================================

INSERT INTO categorias (id, tienda_id, nombre, icono, orden)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
   'Papelería', 'document-text', 1),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001',
   'Cervezas', 'beer', 2),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001',
   'Bebidas', 'water', 3),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001',
   'Onces', 'fast-food', 4);

-- ============================================
-- 5. CREAR PRODUCTOS
-- ============================================

INSERT INTO productos (
  tienda_id, categoria_id, proveedor_id,
  nombre, precio_compra, precio_venta,
  stock_actual, stock_minimo, stock_maximo
) VALUES
  -- Papelería
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 
   '10000000-0000-0000-0000-000000000002',
   'Cuaderno 100 hojas', 3000, 5000, 20, 5, 50),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   'Lapicero BIC Azul', 800, 1500, 50, 10, 100),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000002',
   'Borrador Nata', 500, 1000, 30, 10, 60),
  
  -- Cervezas
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000003',
   'Cerveza Poker 330ml', 1800, 3000, 24, 12, 48),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000003',
   'Cerveza Águila 330ml', 1800, 3000, 24, 12, 48),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000003',
   'Cerveza Club Colombia 330ml', 2000, 3500, 12, 6, 36),
  
  -- Bebidas
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000003',
   'Coca Cola 400ml', 1500, 2500, 30, 15, 60),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000003',
   'Agua Cristal 600ml', 800, 1500, 40, 20, 80),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000003',
   'Jugo Hit Mora 200ml', 1200, 2000, 25, 12, 50),
  
  -- Onces
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   'Empanada de carne', 1000, 2000, 10, 5, 20),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   'Papas Margarita', 1200, 2000, 25, 10, 50),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004',
   '10000000-0000-0000-0000-000000000001',
   'Galletas Festival', 1500, 2500, 20, 8, 40);

-- ============================================
-- 6. CREAR CLIENTES (Para fiados)
-- ============================================

INSERT INTO clientes (
  tienda_id, nombre_completo, documento, telefono,
  limite_credito, saldo_pendiente
) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Juan Pérez', '1234567890', '3001234567', 500000, 0),
  ('00000000-0000-0000-0000-000000000001', 'María García', '0987654321', '3109876543', 300000, 0),
  ('00000000-0000-0000-0000-000000000001', 'Carlos López', '5555555555', '3158765432', 200000, 0),
  ('00000000-0000-0000-0000-000000000001', 'Ana Martínez', '1111111111', '3201111111', 400000, 0);

-- ============================================
-- 7. VERIFICAR TIPOS DE PAGO
-- ============================================

-- Los tipos de pago ya fueron creados en el schema principal
-- Verificar que existen:
SELECT codigo, nombre, es_credito, requiere_referencia 
FROM tipos_pago 
WHERE tienda_id IS NULL
ORDER BY orden;

-- ============================================
-- 8. EJEMPLO DE SESIÓN Y VENTAS
-- ============================================

-- NOTA: Reemplazar 'user-id-from-auth' con el ID real del usuario

/*
-- Crear sesión
INSERT INTO sesiones (id, tienda_id, usuario_id, efectivo_inicial)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'user-id-from-auth',
  50000
);

-- Venta en efectivo
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id, numero_venta,
  subtotal, total, tipo_pago_id, pagada
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'user-id-from-auth',
  'V-001',
  5000,
  5000,
  (SELECT id FROM tipos_pago WHERE codigo = 'efectivo' LIMIT 1),
  true
);

-- Venta con Daviplata
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id, numero_venta,
  subtotal, total, tipo_pago_id, referencia_pago, pagada
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'user-id-from-auth',
  'V-002',
  10000,
  10000,
  (SELECT id FROM tipos_pago WHERE codigo = 'daviplata' LIMIT 1),
  '123456789',
  true
);

-- Venta fiada
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id, cliente_id, numero_venta,
  subtotal, total, tipo_pago_id, pagada
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'user-id-from-auth',
  (SELECT id FROM clientes WHERE documento = '1234567890' LIMIT 1),
  'V-003',
  50000,
  50000,
  (SELECT id FROM tipos_pago WHERE codigo = 'fiado' LIMIT 1),
  false
);
*/

-- ============================================
-- RESUMEN DE DATOS CREADOS
-- ============================================

SELECT 
  'Tiendas' as tabla, COUNT(*) as registros FROM tiendas
UNION ALL
SELECT 'Proveedores', COUNT(*) FROM proveedores
UNION ALL
SELECT 'Categorías', COUNT(*) FROM categorias
UNION ALL
SELECT 'Productos', COUNT(*) FROM productos
UNION ALL
SELECT 'Clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'Tipos de Pago', COUNT(*) FROM tipos_pago;
