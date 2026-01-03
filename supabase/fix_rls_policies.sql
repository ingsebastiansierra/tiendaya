-- ============================================
-- AGREGAR POLÍTICAS RLS FALTANTES
-- ============================================

-- CRÍTICO: Sin estas políticas, los usuarios no pueden leer sus propios datos

-- 1. Política para tabla usuarios
-- Permitir que los usuarios lean su propio perfil
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Permitir que los usuarios actualicen su propio perfil
CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE
  USING (auth.uid() = id);

-- 2. Política para tabla usuarios_tiendas
-- Permitir que los usuarios lean sus propias asociaciones de tiendas
CREATE POLICY "usuarios_tiendas_select_own" ON usuarios_tiendas
  FOR SELECT
  USING (auth.uid() = usuario_id);

-- Permitir insertar asociaciones (para onboarding)
CREATE POLICY "usuarios_tiendas_insert_own" ON usuarios_tiendas
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- 3. Política para tabla tiendas
-- Permitir que los usuarios lean las tiendas a las que tienen acceso
CREATE POLICY "tiendas_select" ON tiendas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM usuarios_tiendas 
      WHERE usuario_id = auth.uid() 
        AND tienda_id = tiendas.id 
        AND activo = true
    )
  );

-- Permitir insertar tiendas (para onboarding)
CREATE POLICY "tiendas_insert" ON tiendas
  FOR INSERT
  WITH CHECK (true); -- Cualquier usuario autenticado puede crear una tienda

-- Permitir actualizar tiendas si el usuario es admin_general o dueño_local
CREATE POLICY "tiendas_update" ON tiendas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM usuarios_tiendas 
      WHERE usuario_id = auth.uid() 
        AND tienda_id = tiendas.id 
        AND activo = true
        AND rol IN ('admin_general', 'dueño_local')
    )
  );

-- 4. Políticas para proveedores
CREATE POLICY "proveedores_select" ON proveedores
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

CREATE POLICY "proveedores_update" ON proveedores
  FOR UPDATE
  USING (tiene_acceso_tienda(tienda_id));

-- 5. Políticas para gastos
CREATE POLICY "gastos_select" ON gastos
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'usuarios_tiendas', 'tiendas', 'proveedores', 'gastos')
ORDER BY tablename, policyname;
