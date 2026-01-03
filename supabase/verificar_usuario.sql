-- Verificar usuario y sus tiendas asociadas
-- Usuario: vegasebastian073@gmail.com
-- UUID: dd372437-8cf1-43b0-aa80-fc316caf6908

-- 1. Verificar que el usuario existe en auth.users
SELECT 
  'AUTH USER' as tabla,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'vegasebastian073@gmail.com';

-- 2. Verificar que el usuario existe en la tabla usuarios
SELECT 
  'USUARIOS' as tabla,
  id,
  email,
  nombre_completo,
  activo
FROM usuarios
WHERE email = 'vegasebastian073@gmail.com';

-- 3. Verificar las tiendas asociadas al usuario
SELECT 
  'USUARIOS_TIENDAS' as tabla,
  ut.id,
  ut.usuario_id,
  ut.tienda_id,
  ut.rol,
  ut.activo,
  t.nombre as tienda_nombre,
  t.activa as tienda_activa
FROM usuarios_tiendas ut
LEFT JOIN tiendas t ON t.id = ut.tienda_id
WHERE ut.usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908';

-- 4. Si no hay asociación, crearla con la Tienda Principal
DO $$
BEGIN
  -- Verificar si ya existe la asociación
  IF NOT EXISTS (
    SELECT 1 FROM usuarios_tiendas 
    WHERE usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908'
  ) THEN
    -- Crear el usuario en la tabla usuarios si no existe
    INSERT INTO usuarios (id, email, nombre_completo, activo)
    VALUES (
      'dd372437-8cf1-43b0-aa80-fc316caf6908',
      'vegasebastian073@gmail.com',
      'Sebastian Vegas',
      true
    )
    ON CONFLICT (id) DO NOTHING;

    -- Crear la asociación con Tienda Principal
    INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol, activo)
    VALUES (
      'dd372437-8cf1-43b0-aa80-fc316caf6908',
      '809d8e08-f21e-419e-817d-e232826918f1',
      'admin_general',
      true
    );
    
    RAISE NOTICE 'Usuario asociado a Tienda Principal';
  ELSE
    RAISE NOTICE 'Usuario ya tiene tiendas asociadas';
  END IF;
END $$;

-- 5. Verificar resultado final
SELECT 
  u.email,
  u.nombre_completo,
  t.nombre as tienda,
  ut.rol,
  ut.activo as asociacion_activa,
  t.activa as tienda_activa
FROM usuarios u
JOIN usuarios_tiendas ut ON ut.usuario_id = u.id
JOIN tiendas t ON t.id = ut.tienda_id
WHERE u.email = 'vegasebastian073@gmail.com';
