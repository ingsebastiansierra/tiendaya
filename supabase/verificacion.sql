-- ============================================
-- SCRIPT DE VERIFICACIÓN
-- Ejecutar después de crear el schema
-- ============================================

-- 1. Verificar que todas las tablas existen
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'tiendas', 'usuarios', 'usuarios_tiendas', 'proveedores',
      'categorias', 'productos', 'tipos_pago', 'clientes',
      'sesiones', 'ventas', 'ventas_detalle', 'pagos_fiados',
      'gastos', 'pedidos', 'pedidos_detalle', 'alertas',
      'movimientos_inventario', 'logs_auditoria'
    ) THEN '✅'
    ELSE '❌'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar tipos ENUM
SELECT 
  typname as tipo_enum,
  '✅' as status
FROM pg_type
WHERE typname IN ('rol_tipo', 'tipo_gasto', 'estado_pedido', 'tipo_alerta', 'tipo_movimiento');

-- 3. Verificar que los tipos de pago se insertaron
SELECT 
  codigo,
  nombre,
  es_credito,
  requiere_referencia,
  '✅' as status
FROM tipos_pago
WHERE tienda_id IS NULL
ORDER BY orden;

-- 4. Verificar funciones creadas
SELECT 
  routine_name as funcion,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'actualizar_stock_venta',
    'verificar_stock_bajo',
    'actualizar_saldo_cliente_venta',
    'actualizar_saldo_cliente_pago',
    'verificar_limite_credito',
    'verificar_venta_pagada',
    'tiene_acceso_tienda'
  );

-- 5. Verificar triggers
SELECT 
  trigger_name,
  event_object_table as tabla,
  '✅' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_actualizar_stock_venta',
    'trigger_verificar_stock_bajo',
    'trigger_actualizar_saldo_cliente_venta',
    'trigger_actualizar_saldo_cliente_pago'
  );

-- 6. Verificar políticas RLS
SELECT 
  tablename as tabla,
  policyname as politica,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. Verificar índices importantes
SELECT 
  tablename as tabla,
  indexname as indice,
  '✅' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 8. Contar registros en tablas principales
SELECT 'tiendas' as tabla, COUNT(*) as registros FROM tiendas
UNION ALL
SELECT 'tipos_pago', COUNT(*) FROM tipos_pago
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'productos', COUNT(*) FROM productos
UNION ALL
SELECT 'ventas', COUNT(*) FROM ventas;

-- ============================================
-- PRUEBAS FUNCIONALES
-- ============================================

-- Prueba 1: Verificar que RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('productos', 'ventas', 'clientes', 'tipos_pago')
ORDER BY tablename;

-- Prueba 2: Verificar constraints
SELECT
  tc.table_name as tabla,
  tc.constraint_name as constraint,
  tc.constraint_type as tipo,
  '✅' as status
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================
-- RESUMEN FINAL
-- ============================================

SELECT 
  '📊 RESUMEN DE VERIFICACIÓN' as titulo,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tablas,
  (SELECT COUNT(*) FROM pg_type 
   WHERE typname IN ('rol_tipo', 'tipo_gasto', 'estado_pedido', 'tipo_alerta', 'tipo_movimiento')) as total_enums,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') as total_funciones,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE trigger_schema = 'public') as total_triggers,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'public') as total_politicas_rls,
  (SELECT COUNT(*) FROM tipos_pago WHERE tienda_id IS NULL) as tipos_pago_globales;
