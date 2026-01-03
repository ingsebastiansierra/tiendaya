-- ============================================
-- ASOCIAR USUARIO EXISTENTE A TIENDA EXISTENTE
-- Usuario: vegasebastian073@gmail.com
-- UUID: dd372437-8cf1-43b0-aa80-fc316caf6908
-- Tienda: Tienda Principal
-- UUID: 809d8e08-f21e-419e-817d-e232826918f1
-- ============================================

-- PASO 1: Verificar que el usuario existe en la tabla usuarios
-- Si no existe, crearlo
INSERT INTO usuarios (id, email, nombre_completo, telefono, activo)
VALUES (
  'dd372437-8cf1-43b0-aa80-fc316caf6908',
  'vegasebastian073@gmail.com',
  'Sebastian Vegas',
  '3001234567',
  true
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  nombre_completo = EXCLUDED.nombre_completo,
  activo = true;

-- PASO 2: Verificar que la tienda existe
SELECT id, nombre, activa 
FROM tiendas 
WHERE id = '809d8e08-f21e-419e-817d-e232826918f1';

-- PASO 3: Eliminar cualquier asociación previa (por si acaso)
DELETE FROM usuarios_tiendas 
WHERE usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908';

-- PASO 4: Crear la asociación usuario-tienda
INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol, activo)
VALUES (
  'dd372437-8cf1-43b0-aa80-fc316caf6908',
  '809d8e08-f21e-419e-817d-e232826918f1',
  'admin_general',
  true
);

-- PASO 5: Verificar la asociación
SELECT 
  ut.usuario_id,
  ut.tienda_id,
  ut.rol,
  ut.activo,
  u.email,
  u.nombre_completo,
  t.nombre as tienda_nombre
FROM usuarios_tiendas ut
JOIN usuarios u ON u.id = ut.usuario_id
JOIN tiendas t ON t.id = ut.tienda_id
WHERE ut.usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908';
