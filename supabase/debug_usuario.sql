-- ============================================
-- DEBUG: Verificar por qué el usuario no ve tiendas
-- ============================================

-- 1. Verificar usuario en auth.users
SELECT 
  '1. Usuario en Auth' as paso,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'vegasebastian073@gmail.com';

-- 2. Verificar usuario en tabla usuarios
SELECT 
  '2. Usuario en tabla usuarios' as paso,
  id,
  email,
  nombre_completo,
  activo
FROM usuarios
WHERE email = 'vegasebastian073@gmail.com';

-- 3. Verificar asociaciones en usuarios_tiendas
SELECT 
  '3. Asociaciones usuarios_tiendas' as paso,
  ut.id,
  ut.usuario_id,
  ut.tienda_id,
  ut.rol,
  ut.activo,
  ut.created_at
FROM usuarios_tiendas ut
WHERE ut.usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908';

-- 4. Verificar con JOIN completo
SELECT 
  '4. JOIN completo' as paso,
  u.email,
  u.nombre_completo,
  ut.rol,
  ut.activo as asociacion_activa,
  t.id as tienda_id,
  t.nombre as tienda_nombre,
  t.activa as tienda_activa
FROM usuarios u
LEFT JOIN usuarios_tiendas ut ON ut.usuario_id = u.id
LEFT JOIN tiendas t ON t.id = ut.tienda_id
WHERE u.email = 'vegasebastian073@gmail.com';

-- 5. Simular la consulta que hace la app
-- Esta es la consulta EXACTA que hace AuthContext
SELECT 
  '5. Consulta de la app' as paso,
  ut.*,
  json_build_object(
    'id', t.id,
    'nombre', t.nombre,
    'slug', t.slug,
    'direccion', t.direccion,
    'telefono', t.telefono,
    'activa', t.activa
  ) as tiendas
FROM usuarios_tiendas ut
LEFT JOIN tiendas t ON t.id = ut.tienda_id
WHERE ut.usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908'
  AND ut.activo = true;

-- 6. Verificar que la tienda existe
SELECT 
  '6. Tienda existe' as paso,
  id,
  nombre,
  activa
FROM tiendas
WHERE id = '809d8e08-f21e-419e-817d-e232826918f1';
