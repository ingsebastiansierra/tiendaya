-- ============================================
-- VERIFICAR Y CORREGIR USUARIO-TIENDA
-- ============================================

-- PASO 1: Verificar usuario en auth.users
SELECT 
  '1️⃣ USUARIO EN AUTH' as paso,
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'vegasebastian073@gmail.com';

-- PASO 2: Verificar usuario en tabla usuarios
SELECT 
  '2️⃣ USUARIO EN TABLA USUARIOS' as paso,
  id,
  email,
  nombre_completo,
  activo
FROM usuarios
WHERE email = 'vegasebastian073@gmail.com';

-- PASO 3: Verificar tiendas existentes
SELECT 
  '3️⃣ TIENDAS DISPONIBLES' as paso,
  id,
  nombre,
  slug,
  activa
FROM tiendas
ORDER BY created_at DESC;

-- PASO 4: Verificar relación usuario-tienda
SELECT 
  '4️⃣ RELACIÓN USUARIO-TIENDA' as paso,
  ut.id,
  ut.usuario_id,
  ut.tienda_id,
  ut.rol,
  ut.activo,
  t.nombre as nombre_tienda,
  u.email as email_usuario
FROM usuarios_tiendas ut
JOIN tiendas t ON t.id = ut.tienda_id
JOIN usuarios u ON u.id = ut.usuario_id
WHERE u.email = 'vegasebastian073@gmail.com';

-- ============================================
-- SI NO APARECE NADA EN EL PASO 4, EJECUTA ESTO:
-- ============================================

-- Primero, obtén el ID del usuario de auth
DO $$
DECLARE
  v_user_id UUID;
  v_tienda_id UUID;
BEGIN
  -- Obtener ID del usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'vegasebastian073@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Usuario no encontrado en auth.users. Debes crearlo primero en Authentication > Users';
  END IF;
  
  RAISE NOTICE '✅ Usuario encontrado: %', v_user_id;
  
  -- Verificar si existe en tabla usuarios
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = v_user_id) THEN
    -- Crear perfil de usuario
    INSERT INTO usuarios (id, email, nombre_completo, activo)
    VALUES (
      v_user_id,
      'vegasebastian073@gmail.com',
      'Sebastian Vegas',
      true
    );
    RAISE NOTICE '✅ Perfil de usuario creado';
  ELSE
    RAISE NOTICE '✅ Perfil de usuario ya existe';
  END IF;
  
  -- Verificar si existe una tienda
  SELECT id INTO v_tienda_id
  FROM tiendas
  WHERE slug = 'tienda-sebastian'
  LIMIT 1;
  
  IF v_tienda_id IS NULL THEN
    -- Crear tienda
    INSERT INTO tiendas (nombre, slug, direccion, telefono, email, activa)
    VALUES (
      'Tienda Sebastian',
      'tienda-sebastian',
      'Calle 123 #45-67, Bogotá',
      '3001234567',
      'vegasebastian073@gmail.com',
      true
    )
    RETURNING id INTO v_tienda_id;
    RAISE NOTICE '✅ Tienda creada: %', v_tienda_id;
  ELSE
    RAISE NOTICE '✅ Tienda ya existe: %', v_tienda_id;
  END IF;
  
  -- Verificar si existe la relación usuario-tienda
  IF NOT EXISTS (
    SELECT 1 FROM usuarios_tiendas 
    WHERE usuario_id = v_user_id AND tienda_id = v_tienda_id
  ) THEN
    -- Crear relación usuario-tienda
    INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol, activo)
    VALUES (
      v_user_id,
      v_tienda_id,
      'admin_general',
      true
    );
    RAISE NOTICE '✅ Relación usuario-tienda creada';
  ELSE
    -- Asegurarse de que esté activa
    UPDATE usuarios_tiendas
    SET activo = true
    WHERE usuario_id = v_user_id AND tienda_id = v_tienda_id;
    RAISE NOTICE '✅ Relación usuario-tienda ya existe y está activa';
  END IF;
  
END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

SELECT 
  '✅ VERIFICACIÓN FINAL' as resultado,
  u.email,
  u.nombre_completo,
  t.nombre as tienda,
  ut.rol,
  ut.activo as relacion_activa
FROM usuarios u
JOIN usuarios_tiendas ut ON ut.usuario_id = u.id
JOIN tiendas t ON t.id = ut.tienda_id
WHERE u.email = 'vegasebastian073@gmail.com';
