-- ============================================
-- QUERIES ÚTILES PARA TIPOS DE PAGO Y FIADOS
-- ============================================

-- ============================================
-- 1. CONSULTAS DE TIPOS DE PAGO
-- ============================================

-- Obtener todos los tipos de pago disponibles para una tienda
SELECT 
  tp.id,
  tp.nombre,
  tp.codigo,
  tp.descripcion,
  tp.icono,
  tp.color,
  tp.requiere_referencia,
  tp.es_credito,
  tp.activo,
  CASE 
    WHEN tp.tienda_id IS NULL THEN 'Global'
    ELSE 'Personalizado'
  END as tipo
FROM tipos_pago tp
WHERE tp.activo = true
  AND (tp.tienda_id IS NULL OR tp.tienda_id = 'uuid-tienda')
ORDER BY tp.orden;

-- ============================================
-- 2. REPORTES DE VENTAS POR TIPO DE PAGO
-- ============================================

-- Ventas del día por tipo de pago
SELECT 
  tp.nombre as tipo_pago,
  tp.codigo,
  COUNT(v.id) as cantidad_ventas,
  SUM(v.total) as total_vendido,
  ROUND(SUM(v.total) * 100.0 / SUM(SUM(v.total)) OVER (), 2) as porcentaje
FROM ventas v
JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
WHERE v.tienda_id = 'uuid-tienda'
  AND DATE(v.created_at) = CURRENT_DATE
  AND v.estado = 'completada'
GROUP BY tp.id, tp.nombre, tp.codigo
ORDER BY total_vendido DESC;

-- Ventas por rango de fechas y tipo de pago
SELECT 
  DATE(v.created_at) as fecha,
  tp.nombre as tipo_pago,
  COUNT(v.id) as cantidad,
  SUM(v.total) as total
FROM ventas v
JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
WHERE v.tienda_id = 'uuid-tienda'
  AND v.created_at BETWEEN '2024-01-01' AND '2024-01-31'
  AND v.estado = 'completada'
GROUP BY DATE(v.created_at), tp.id, tp.nombre
ORDER BY fecha DESC, total DESC;

-- ============================================
-- 3. GESTIÓN DE CLIENTES Y FIADOS
-- ============================================

-- Listar todos los clientes con su estado de crédito
SELECT 
  c.id,
  c.nombre_completo,
  c.telefono,
  c.documento,
  c.limite_credito,
  c.saldo_pendiente,
  c.limite_credito - c.saldo_pendiente as credito_disponible,
  ROUND((c.saldo_pendiente * 100.0 / NULLIF(c.limite_credito, 0)), 2) as porcentaje_usado,
  COUNT(v.id) FILTER (WHERE v.pagada = false) as ventas_pendientes,
  MAX(v.created_at) as ultima_compra
FROM clientes c
LEFT JOIN ventas v ON v.cliente_id = c.id
WHERE c.tienda_id = 'uuid-tienda'
  AND c.activo = true
GROUP BY c.id
ORDER BY c.saldo_pendiente DESC;

-- Clientes con deuda vencida (más de 30 días)
SELECT 
  c.nombre_completo,
  c.telefono,
  v.numero_venta,
  v.total,
  v.created_at as fecha_venta,
  CURRENT_DATE - DATE(v.created_at) as dias_vencidos,
  COALESCE(SUM(pf.monto), 0) as total_abonado,
  v.total - COALESCE(SUM(pf.monto), 0) as saldo_pendiente
FROM clientes c
JOIN ventas v ON v.cliente_id = c.id
LEFT JOIN pagos_fiados pf ON pf.venta_id = v.id
WHERE c.tienda_id = 'uuid-tienda'
  AND v.pagada = false
  AND v.created_at < CURRENT_DATE - INTERVAL '30 days'
GROUP BY c.id, c.nombre_completo, c.telefono, v.id, v.numero_venta, v.total, v.created_at
ORDER BY dias_vencidos DESC;

-- Top 10 clientes con mayor deuda
SELECT 
  c.nombre_completo,
  c.telefono,
  c.saldo_pendiente,
  c.limite_credito,
  COUNT(v.id) FILTER (WHERE v.pagada = false) as ventas_pendientes,
  MIN(v.created_at) FILTER (WHERE v.pagada = false) as deuda_mas_antigua
FROM clientes c
LEFT JOIN ventas v ON v.cliente_id = c.id
WHERE c.tienda_id = 'uuid-tienda'
  AND c.saldo_pendiente > 0
GROUP BY c.id, c.nombre_completo, c.telefono, c.saldo_pendiente, c.limite_credito
ORDER BY c.saldo_pendiente DESC
LIMIT 10;

-- ============================================
-- 4. DETALLE DE VENTAS FIADAS
-- ============================================

-- Ver detalle completo de una venta fiada con sus abonos
SELECT 
  v.numero_venta,
  v.total as total_venta,
  v.created_at as fecha_venta,
  c.nombre_completo as cliente,
  c.telefono,
  v.pagada,
  COALESCE(SUM(pf.monto), 0) as total_abonado,
  v.total - COALESCE(SUM(pf.monto), 0) as saldo_pendiente,
  json_agg(
    json_build_object(
      'fecha', pf.created_at,
      'monto', pf.monto,
      'tipo_pago', tp.nombre,
      'referencia', pf.referencia_pago
    ) ORDER BY pf.created_at
  ) FILTER (WHERE pf.id IS NOT NULL) as abonos
FROM ventas v
JOIN clientes c ON c.id = v.cliente_id
LEFT JOIN pagos_fiados pf ON pf.venta_id = v.id
LEFT JOIN tipos_pago tp ON tp.id = pf.tipo_pago_id
WHERE v.id = 'uuid-venta'
GROUP BY v.id, v.numero_venta, v.total, v.created_at, c.nombre_completo, c.telefono, v.pagada;

-- Historial de abonos de un cliente
SELECT 
  pf.created_at as fecha_abono,
  v.numero_venta,
  pf.monto,
  tp.nombre as tipo_pago,
  pf.referencia_pago,
  u.nombre_completo as registrado_por,
  pf.notas
FROM pagos_fiados pf
JOIN ventas v ON v.id = pf.venta_id
JOIN tipos_pago tp ON tp.id = pf.tipo_pago_id
JOIN usuarios u ON u.id = pf.usuario_id
WHERE pf.cliente_id = 'uuid-cliente'
ORDER BY pf.created_at DESC;

-- ============================================
-- 5. CUADRE DE CAJA POR TIPO DE PAGO
-- ============================================

-- Cuadre de caja de una sesión por tipo de pago
SELECT 
  tp.nombre as tipo_pago,
  tp.codigo,
  COUNT(v.id) as cantidad_ventas,
  SUM(v.total) as total,
  CASE 
    WHEN tp.codigo = 'efectivo' THEN 'Debe estar en caja'
    WHEN tp.es_credito THEN 'Pendiente de cobro'
    ELSE 'Verificar en cuenta'
  END as observacion
FROM ventas v
JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
WHERE v.sesion_id = 'uuid-sesion'
  AND v.estado = 'completada'
GROUP BY tp.id, tp.nombre, tp.codigo, tp.es_credito
ORDER BY total DESC;

-- Efectivo esperado vs efectivo real en sesión
SELECT 
  s.efectivo_inicial,
  COALESCE(SUM(v.total) FILTER (WHERE tp.codigo = 'efectivo'), 0) as ventas_efectivo,
  COALESCE(SUM(pf.monto) FILTER (WHERE tp2.codigo = 'efectivo'), 0) as abonos_efectivo,
  COALESCE(SUM(g.monto), 0) as gastos,
  s.efectivo_inicial + 
    COALESCE(SUM(v.total) FILTER (WHERE tp.codigo = 'efectivo'), 0) +
    COALESCE(SUM(pf.monto) FILTER (WHERE tp2.codigo = 'efectivo'), 0) -
    COALESCE(SUM(g.monto), 0) as efectivo_esperado,
  s.efectivo_final,
  s.diferencia
FROM sesiones s
LEFT JOIN ventas v ON v.sesion_id = s.id
LEFT JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
LEFT JOIN pagos_fiados pf ON pf.tienda_id = s.tienda_id 
  AND DATE(pf.created_at) = DATE(s.fecha_apertura)
LEFT JOIN tipos_pago tp2 ON tp2.id = pf.tipo_pago_id
LEFT JOIN gastos g ON g.sesion_id = s.id
WHERE s.id = 'uuid-sesion'
GROUP BY s.id;

-- ============================================
-- 6. ANÁLISIS Y ESTADÍSTICAS
-- ============================================

-- Método de pago más usado por mes
SELECT 
  DATE_TRUNC('month', v.created_at) as mes,
  tp.nombre as tipo_pago,
  COUNT(v.id) as cantidad,
  SUM(v.total) as total,
  RANK() OVER (PARTITION BY DATE_TRUNC('month', v.created_at) ORDER BY COUNT(v.id) DESC) as ranking
FROM ventas v
JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
WHERE v.tienda_id = 'uuid-tienda'
  AND v.created_at >= CURRENT_DATE - INTERVAL '6 months'
  AND v.estado = 'completada'
GROUP BY DATE_TRUNC('month', v.created_at), tp.id, tp.nombre
ORDER BY mes DESC, ranking;

-- Comparación de ventas fiadas vs pagadas
SELECT 
  DATE(v.created_at) as fecha,
  COUNT(*) FILTER (WHERE tp.es_credito = false) as ventas_pagadas,
  SUM(v.total) FILTER (WHERE tp.es_credito = false) as total_pagado,
  COUNT(*) FILTER (WHERE tp.es_credito = true) as ventas_fiadas,
  SUM(v.total) FILTER (WHERE tp.es_credito = true) as total_fiado,
  ROUND(
    SUM(v.total) FILTER (WHERE tp.es_credito = true) * 100.0 / 
    NULLIF(SUM(v.total), 0), 
    2
  ) as porcentaje_fiado
FROM ventas v
JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
WHERE v.tienda_id = 'uuid-tienda'
  AND v.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND v.estado = 'completada'
GROUP BY DATE(v.created_at)
ORDER BY fecha DESC;

-- Tasa de recuperación de cartera (fiados cobrados)
SELECT 
  DATE_TRUNC('month', v.created_at) as mes,
  SUM(v.total) as total_fiado,
  COALESCE(SUM(pf.monto), 0) as total_cobrado,
  ROUND(COALESCE(SUM(pf.monto), 0) * 100.0 / NULLIF(SUM(v.total), 0), 2) as tasa_recuperacion
FROM ventas v
LEFT JOIN pagos_fiados pf ON pf.venta_id = v.id
JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
WHERE v.tienda_id = 'uuid-tienda'
  AND tp.es_credito = true
  AND v.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', v.created_at)
ORDER BY mes DESC;

-- ============================================
-- 7. FUNCIONES ÚTILES
-- ============================================

-- Función para obtener saldo de un cliente
CREATE OR REPLACE FUNCTION obtener_saldo_cliente(p_cliente_id UUID)
RETURNS TABLE (
  total_fiado DECIMAL(10,2),
  total_abonado DECIMAL(10,2),
  saldo_pendiente DECIMAL(10,2),
  ventas_pendientes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(v.total), 0) as total_fiado,
    COALESCE(SUM(pf.monto), 0) as total_abonado,
    COALESCE(SUM(v.total), 0) - COALESCE(SUM(pf.monto), 0) as saldo_pendiente,
    COUNT(DISTINCT v.id) FILTER (WHERE v.pagada = false)::INTEGER as ventas_pendientes
  FROM ventas v
  LEFT JOIN pagos_fiados pf ON pf.venta_id = v.id
  JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
  WHERE v.cliente_id = p_cliente_id
    AND tp.es_credito = true;
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT * FROM obtener_saldo_cliente('uuid-cliente');

-- Función para verificar si un cliente puede comprar fiado
CREATE OR REPLACE FUNCTION puede_comprar_fiado(
  p_cliente_id UUID,
  p_monto DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limite DECIMAL(10,2);
  v_saldo DECIMAL(10,2);
BEGIN
  SELECT limite_credito, saldo_pendiente
  INTO v_limite, v_saldo
  FROM clientes
  WHERE id = p_cliente_id AND activo = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN (v_saldo + p_monto) <= v_limite;
END;
$$ LANGUAGE plpgsql;

-- Uso: SELECT puede_comprar_fiado('uuid-cliente', 50000);

-- ============================================
-- 8. VISTAS ÚTILES
-- ============================================

-- Vista de resumen de clientes
CREATE OR REPLACE VIEW vista_resumen_clientes AS
SELECT 
  c.id,
  c.tienda_id,
  c.nombre_completo,
  c.telefono,
  c.documento,
  c.limite_credito,
  c.saldo_pendiente,
  c.limite_credito - c.saldo_pendiente as credito_disponible,
  COUNT(v.id) FILTER (WHERE v.pagada = false) as ventas_pendientes,
  COUNT(v.id) as total_ventas,
  COALESCE(SUM(v.total), 0) as total_comprado,
  MAX(v.created_at) as ultima_compra,
  MIN(v.created_at) FILTER (WHERE v.pagada = false) as deuda_mas_antigua,
  CASE 
    WHEN c.saldo_pendiente = 0 THEN 'Al día'
    WHEN c.saldo_pendiente > c.limite_credito THEN 'Excedido'
    WHEN c.saldo_pendiente > c.limite_credito * 0.8 THEN 'Crítico'
    ELSE 'Normal'
  END as estado_credito
FROM clientes c
LEFT JOIN ventas v ON v.cliente_id = c.id
WHERE c.activo = true
GROUP BY c.id;

-- Uso: SELECT * FROM vista_resumen_clientes WHERE tienda_id = 'uuid-tienda';
