-- ============================================
-- FIX COMPLETO: Asegurar que todo esté correcto
-- ============================================

-- PASO 1: Asegurar que el usuario existe en la tabla usuarios
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

-- PASO 2: Limpiar asociaciones previas
DELETE FROM usuarios_tiendas 
WHERE usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908';

-- PASO 3: Crear la asociación con Tienda Principal
INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol, activo)
VALUES (
  'dd372437-8cf1-43b0-aa80-fc316caf6908',
  '809d8e08-f21e-419e-817d-e232826918f1',
  'admin_general',
  true
);

-- PASO 4: Verificar resultado
SELECT 
  '✅ VERIFICACIÓN FINAL' as status,
  u.id as usuario_id,
  u.email,
  u.nombre_completo,
  u.activo as usuario_activo,
  ut.id as asociacion_id,
  ut.tienda_id,
  ut.rol,
  ut.activo as asociacion_activa,
  t.nombre as tienda_nombre,
  t.activa as tienda_activa
FROM usuarios u
JOIN usuarios_tiendas ut ON ut.usuario_id = u.id
JOIN tiendas t ON t.id = ut.tienda_id
WHERE u.id = 'dd372437-8cf1-43b0-aa80-fc316caf6908';

-- PASO 5: Simular la consulta exacta de la app
SELECT 
  '✅ CONSULTA DE LA APP' as status,
  ut.*
FROM usuarios_tiendas ut
WHERE ut.usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908'
  AND ut.activo = true;
