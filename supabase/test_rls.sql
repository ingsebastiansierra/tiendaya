-- ============================================
-- PROBAR POLÍTICAS RLS
-- ============================================

-- Este script simula las consultas que hace la app
-- Ejecuta esto después de aplicar fix_rls_policies.sql

-- 1. Verificar que el usuario puede leer su propio perfil
-- (Simula: SELECT * FROM usuarios WHERE id = auth.uid())
SELECT 
  '1. Usuario puede leer su perfil' as test,
  COUNT(*) as resultado,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM usuarios
WHERE id = 'dd372437-8cf1-43b0-aa80-fc316caf6908';

-- 2. Verificar que el usuario puede leer sus tiendas
-- (Simula: SELECT * FROM usuarios_tiendas WHERE usuario_id = auth.uid())
SELECT 
  '2. Usuario puede leer sus tiendas' as test,
  COUNT(*) as resultado,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM usuarios_tiendas
WHERE usuario_id = 'dd372437-8cf1-43b0-aa80-fc316caf6908'
  AND activo = true;

-- 3. Verificar que el usuario puede leer los datos de la tienda
SELECT 
  '3. Usuario puede leer datos de tienda' as test,
  COUNT(*) as resultado,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM tiendas
WHERE id = '809d8e08-f21e-419e-817d-e232826918f1';

-- 4. Mostrar todas las políticas activas
SELECT 
  '4. Políticas RLS activas' as test,
  tablename,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'usuarios_tiendas', 'tiendas')
ORDER BY tablename, policyname;

-- 5. Verificar que RLS está habilitado
SELECT 
  '5. RLS habilitado en tablas' as test,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ Deshabilitado' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('usuarios', 'usuarios_tiendas', 'tiendas', 'productos', 'ventas')
ORDER BY tablename;
