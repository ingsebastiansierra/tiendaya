-- ============================================
-- CREAR USUARIO DE PRUEBA CON TIENDA
-- Email: vegasebastian073@gmail.com
-- Password: sebas12345
-- ============================================

-- PASO 1: Crear usuario en Supabase Auth
-- IMPORTANTE: Esto debes hacerlo en la UI de Supabase primero
-- 1. Ve a Authentication > Users en Supabase Dashboard
-- 2. Click en "Add user" > "Create new user"
-- 3. Email: vegasebastian073@gmail.com
-- 4. Password: sebas12345
-- 5. Auto Confirm User: ✅ (activar)
-- 6. Copia el UUID del usuario creado

-- PASO 2: Una vez creado el usuario en Auth, ejecuta este script
-- Reemplaza 'USER_ID_FROM_AUTH' con el UUID real del usuario

-- Crear perfil de usuario
INSERT INTO usuarios (id, email, nombre_completo, telefono, activo)
VALUES (
  'USER_ID_FROM_AUTH', -- Reemplazar con el ID real
  'vegasebastian073@gmail.com',
  'Sebastian Vegas',
  '3001234567',
  true
);

-- Crear tienda de prueba
INSERT INTO tiendas (id, nombre, slug, direccion, telefono, email, activa)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Tienda Sebastian',
  'tienda-sebastian',
  'Calle 123 #45-67, Bogotá',
  '3001234567',
  'vegasebastian073@gmail.com',
  true
);

-- Asociar usuario a tienda como admin_general
INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol, activo)
VALUES (
  'USER_ID_FROM_AUTH', -- Reemplazar con el ID real
  '11111111-1111-1111-1111-111111111111',
  'admin_general',
  true
);

-- Crear categorías para la tienda
INSERT INTO categorias (tienda_id, nombre, icono, orden, activa) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Papelería', '📝', 1, true),
  ('11111111-1111-1111-1111-111111111111', 'Cervezas', '🍺', 2, true),
  ('11111111-1111-1111-1111-111111111111', 'Bebidas', '🥤', 3, true),
  ('11111111-1111-1111-1111-111111111111', 'Onces', '🍔', 4, true),
  ('11111111-1111-1111-1111-111111111111', 'Snacks', '🍿', 5, true);

-- Crear proveedores
INSERT INTO proveedores (tienda_id, nombre, contacto, telefono, activo) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Distribuidora ABC', 'Juan Pérez', '3101234567', true),
  ('11111111-1111-1111-1111-111111111111', 'Papelería Central', 'María García', '3209876543', true),
  ('11111111-1111-1111-1111-111111111111', 'Bebidas del Valle', 'Carlos López', '3158765432', true);

-- Crear algunos productos de ejemplo
INSERT INTO productos (
  tienda_id, categoria_id, proveedor_id,
  nombre, precio_compra, precio_venta,
  stock_actual, stock_minimo, stock_maximo, activo
)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  c.id,
  p.id,
  'Producto de ' || c.nombre,
  1000,
  2000,
  10,
  5,
  50,
  true
FROM categorias c
CROSS JOIN proveedores p
WHERE c.tienda_id = '11111111-1111-1111-1111-111111111111'
  AND p.tienda_id = '11111111-1111-1111-1111-111111111111'
LIMIT 10;

-- Crear algunos clientes de ejemplo
INSERT INTO clientes (
  tienda_id, nombre_completo, documento, telefono,
  limite_credito, saldo_pendiente, activo
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Juan Pérez', '1234567890', '3001111111', 500000, 0, true),
  ('11111111-1111-1111-1111-111111111111', 'María García', '0987654321', '3002222222', 300000, 0, true),
  ('11111111-1111-1111-1111-111111111111', 'Carlos López', '5555555555', '3003333333', 200000, 0, true);

-- Verificar que todo se creó correctamente
SELECT 
  'Usuario creado' as tipo,
  email as detalle
FROM usuarios 
WHERE email = 'vegasebastian073@gmail.com'

UNION ALL

SELECT 
  'Tienda creada' as tipo,
  nombre as detalle
FROM tiendas 
WHERE id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT 
  'Categorías creadas' as tipo,
  COUNT(*)::text as detalle
FROM categorias 
WHERE tienda_id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT 
  'Productos creados' as tipo,
  COUNT(*)::text as detalle
FROM productos 
WHERE tienda_id = '11111111-1111-1111-1111-111111111111'

UNION ALL

SELECT 
  'Clientes creados' as tipo,
  COUNT(*)::text as detalle
FROM clientes 
WHERE tienda_id = '11111111-1111-1111-1111-111111111111';
