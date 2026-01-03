-- ============================================
-- 🚨 EJECUTA ESTE SCRIPT EN SUPABASE AHORA
-- ============================================
-- Este script agrega las políticas RLS faltantes
-- Sin estas políticas, los usuarios NO pueden leer sus tiendas

-- 1. Política para usuarios_tiendas (CRÍTICO)
CREATE POLICY "usuarios_tiendas_select_own" ON usuarios_tiendas
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "usuarios_tiendas_insert_own" ON usuarios_tiendas
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- 2. Política para tiendas
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

CREATE POLICY "tiendas_insert" ON tiendas
  FOR INSERT
  WITH CHECK (true);

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

-- 3. Políticas para proveedores
CREATE POLICY "proveedores_select" ON proveedores
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

CREATE POLICY "proveedores_update" ON proveedores
  FOR UPDATE
  USING (tiene_acceso_tienda(tienda_id));

-- 4. Políticas para gastos
CREATE POLICY "gastos_select" ON gastos
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

-- ============================================
-- ✅ VERIFICACIÓN
-- ============================================

-- Ver todas las políticas creadas
SELECT 
  tablename,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('usuarios_tiendas', 'tiendas', 'proveedores', 'gastos')
ORDER BY tablename, policyname;

-- Debe mostrar:
-- usuarios_tiendas | usuarios_tiendas_select_own | SELECT
-- usuarios_tiendas | usuarios_tiendas_insert_own | INSERT
-- tiendas | tiendas_select | SELECT
-- tiendas | tiendas_insert | INSERT
-- tiendas | tiendas_update | UPDATE
-- proveedores | proveedores_select | SELECT
-- proveedores | proveedores_insert | INSERT
-- proveedores | proveedores_update | UPDATE
-- gastos | gastos_select | SELECT
-- gastos | gastos_insert | INSERT
