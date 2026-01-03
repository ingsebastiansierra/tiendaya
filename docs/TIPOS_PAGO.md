# Sistema de Tipos de Pago

## 📋 Descripción General

El sistema de tipos de pago permite gestionar múltiples métodos de pago en la aplicación, incluyendo efectivo, billeteras digitales (Daviplata, Nequi), transferencias, tarjetas y ventas a crédito (fiado).

## 🎯 Características Principales

### 1. Tipos de Pago Predefinidos

La aplicación incluye los siguientes tipos de pago por defecto:

| Tipo | Código | Requiere Referencia | Es Crédito | Color |
|------|--------|---------------------|------------|-------|
| Efectivo | `efectivo` | No | No | Verde |
| Daviplata | `daviplata` | Sí | No | Rojo |
| Nequi | `nequi` | Sí | No | Rosa |
| Fiado | `fiado` | No | Sí | Naranja |
| Transferencia | `transferencia` | Sí | No | Azul |
| Tarjeta | `tarjeta` | Sí | No | Morado |

### 2. Tipos de Pago Personalizados

Cada tienda puede crear sus propios tipos de pago adicionales según sus necesidades.

## 💳 Flujo de Ventas por Tipo de Pago

### Venta en Efectivo

```sql
-- Crear venta en efectivo
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id,
  numero_venta, subtotal, total,
  tipo_pago_id, pagada
)
VALUES (
  'uuid-tienda',
  'uuid-sesion',
  'uuid-usuario',
  'V-001',
  50000,
  50000,
  (SELECT id FROM tipos_pago WHERE codigo = 'efectivo'),
  true
);
```

### Venta con Daviplata/Nequi

```sql
-- Crear venta con Daviplata (requiere referencia)
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id,
  numero_venta, subtotal, total,
  tipo_pago_id, referencia_pago, pagada
)
VALUES (
  'uuid-tienda',
  'uuid-sesion',
  'uuid-usuario',
  'V-002',
  75000,
  75000,
  (SELECT id FROM tipos_pago WHERE codigo = 'daviplata'),
  '123456789', -- Número de transacción
  true
);
```

### Venta Fiada (A Crédito)

```sql
-- 1. Crear o verificar cliente
INSERT INTO clientes (
  tienda_id, nombre_completo, telefono,
  limite_credito, saldo_pendiente
)
VALUES (
  'uuid-tienda',
  'Juan Pérez',
  '3001234567',
  500000, -- Límite de crédito
  0 -- Saldo inicial
)
RETURNING id;

-- 2. Crear venta fiada
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id, cliente_id,
  numero_venta, subtotal, total,
  tipo_pago_id, pagada
)
VALUES (
  'uuid-tienda',
  'uuid-sesion',
  'uuid-usuario',
  'uuid-cliente',
  'V-003',
  100000,
  100000,
  (SELECT id FROM tipos_pago WHERE codigo = 'fiado'),
  false -- No está pagada
);

-- El trigger automáticamente:
-- - Actualiza saldo_pendiente del cliente (+100000)
-- - Verifica si excede el límite de crédito
-- - Crea alerta si es necesario
```

## 💰 Sistema de Abonos (Pagos de Fiados)

### Registrar Abono a Fiado

```sql
-- Cliente abona $50,000 a su deuda
INSERT INTO pagos_fiados (
  tienda_id, venta_id, cliente_id, usuario_id,
  monto, tipo_pago_id, referencia_pago
)
VALUES (
  'uuid-tienda',
  'uuid-venta-fiada',
  'uuid-cliente',
  'uuid-usuario',
  50000,
  (SELECT id FROM tipos_pago WHERE codigo = 'efectivo'),
  NULL
);

-- El trigger automáticamente:
-- - Reduce saldo_pendiente del cliente (-50000)
-- - Verifica si la venta quedó completamente pagada
-- - Actualiza campo 'pagada' si corresponde
```

### Consultar Deudas Pendientes

```sql
-- Ver todas las ventas fiadas pendientes de un cliente
SELECT 
  v.numero_venta,
  v.total,
  v.created_at as fecha_venta,
  COALESCE(SUM(pf.monto), 0) as total_abonado,
  v.total - COALESCE(SUM(pf.monto), 0) as saldo_pendiente
FROM ventas v
LEFT JOIN pagos_fiados pf ON pf.venta_id = v.id
WHERE v.cliente_id = 'uuid-cliente'
  AND v.pagada = false
GROUP BY v.id, v.numero_venta, v.total, v.created_at;

-- Ver resumen de deuda por cliente
SELECT 
  c.nombre_completo,
  c.telefono,
  c.limite_credito,
  c.saldo_pendiente,
  c.limite_credito - c.saldo_pendiente as credito_disponible
FROM clientes c
WHERE c.tienda_id = 'uuid-tienda'
  AND c.saldo_pendiente > 0
ORDER BY c.saldo_pendiente DESC;
```

## 🔔 Alertas Automáticas

### Alerta de Límite de Crédito Excedido

Cuando un cliente excede su límite de crédito, se crea automáticamente una alerta:

```sql
-- La función verificar_limite_credito() crea esta alerta
INSERT INTO alertas (
  tienda_id, tipo, titulo, mensaje, prioridad
)
VALUES (
  'uuid-tienda',
  'movimiento_sospechoso',
  'Límite de crédito excedido',
  'El cliente "Juan Pérez" ha excedido su límite de crédito',
  'alta'
);
```

## 📊 Reportes Útiles

### Ventas por Tipo de Pago (Día Actual)

```sql
SELECT 
  tp.nombre as tipo_pago,
  COUNT(v.id) as cantidad_ventas,
  SUM(v.total) as total_vendido
FROM ventas v
JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
WHERE v.tienda_id = 'uuid-tienda'
  AND DATE(v.created_at) = CURRENT_DATE
GROUP BY tp.id, tp.nombre
ORDER BY total_vendido DESC;
```

### Efectivo Real en Caja

```sql
-- Calcular efectivo real (solo ventas en efectivo)
SELECT 
  s.efectivo_inicial +
  COALESCE(SUM(CASE 
    WHEN tp.codigo = 'efectivo' THEN v.total 
    ELSE 0 
  END), 0) -
  COALESCE(SUM(g.monto), 0) as efectivo_en_caja
FROM sesiones s
LEFT JOIN ventas v ON v.sesion_id = s.id
LEFT JOIN tipos_pago tp ON tp.id = v.tipo_pago_id
LEFT JOIN gastos g ON g.sesion_id = s.id
WHERE s.id = 'uuid-sesion'
GROUP BY s.id, s.efectivo_inicial;
```

### Clientes con Mayor Deuda

```sql
SELECT 
  c.nombre_completo,
  c.telefono,
  c.saldo_pendiente,
  COUNT(v.id) as ventas_pendientes,
  MAX(v.created_at) as ultima_compra
FROM clientes c
LEFT JOIN ventas v ON v.cliente_id = c.id AND v.pagada = false
WHERE c.tienda_id = 'uuid-tienda'
  AND c.saldo_pendiente > 0
GROUP BY c.id, c.nombre_completo, c.telefono, c.saldo_pendiente
ORDER BY c.saldo_pendiente DESC
LIMIT 10;
```

## 🎨 Integración en la UI

### Componente de Selección de Tipo de Pago

```typescript
// Ejemplo en React Native
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

function PaymentTypeSelector({ tiendaId, onSelect }) {
  const { data: tiposPago } = useQuery({
    queryKey: ['tipos-pago', tiendaId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tipos_pago')
        .select('*')
        .or(`tienda_id.is.null,tienda_id.eq.${tiendaId}`)
        .eq('activo', true)
        .order('orden');
      return data;
    }
  });

  return (
    <View>
      {tiposPago?.map(tipo => (
        <TouchableOpacity
          key={tipo.id}
          onPress={() => onSelect(tipo)}
          style={{ backgroundColor: tipo.color }}
        >
          <Icon name={tipo.icono} />
          <Text>{tipo.nombre}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

### Validación de Referencia de Pago

```typescript
// Validar si requiere referencia
function validatePayment(tipoPago, referencia) {
  if (tipoPago.requiere_referencia && !referencia) {
    throw new Error(`${tipoPago.nombre} requiere número de transacción`);
  }
  
  if (tipoPago.es_credito && !clienteId) {
    throw new Error('Las ventas fiadas requieren seleccionar un cliente');
  }
}
```

## 🔒 Permisos y Seguridad

### Políticas RLS

```sql
-- Los usuarios solo pueden ver tipos de pago de su tienda o globales
CREATE POLICY "usuarios_tipos_pago_select" ON tipos_pago
  FOR SELECT
  USING (tienda_id IS NULL OR tiene_acceso_tienda(tienda_id));

-- Solo admin_local y admin_general pueden crear tipos de pago personalizados
CREATE POLICY "admin_tipos_pago_insert" ON tipos_pago
  FOR INSERT
  WITH CHECK (
    tiene_acceso_tienda(tienda_id) AND
    EXISTS (
      SELECT 1 FROM usuarios_tiendas ut
      WHERE ut.usuario_id = auth.uid()
        AND ut.tienda_id = tipos_pago.tienda_id
        AND ut.rol IN ('admin_local', 'admin_general')
    )
  );
```

## 📱 Casos de Uso Comunes

### 1. Venta Mixta (Efectivo + Daviplata)

Para ventas con múltiples métodos de pago, se recomienda:
- Crear una venta por cada método de pago
- O usar el campo `notas` para registrar la combinación

### 2. Cambio de Tipo de Pago

Si se necesita cambiar el tipo de pago de una venta:
```sql
-- Registrar en logs de auditoría
UPDATE ventas
SET tipo_pago_id = 'nuevo-tipo-pago-id',
    updated_at = NOW()
WHERE id = 'uuid-venta';
```

### 3. Agregar Nuevo Tipo de Pago

```sql
-- Ejemplo: Agregar "Bancolombia QR"
INSERT INTO tipos_pago (
  tienda_id, nombre, codigo, descripcion,
  icono, color, requiere_referencia, orden
)
VALUES (
  'uuid-tienda',
  'Bancolombia QR',
  'bancolombia_qr',
  'Pago con código QR de Bancolombia',
  'qrcode',
  '#FFCC00',
  true,
  7
);
```

## 🚀 Mejores Prácticas

1. **Siempre validar** si el tipo de pago requiere referencia antes de guardar
2. **Verificar límite de crédito** antes de crear ventas fiadas
3. **Registrar número de transacción** para pagos digitales (auditoría)
4. **Usar colores consistentes** para cada tipo de pago en la UI
5. **Mostrar alertas** cuando un cliente se acerque a su límite de crédito
6. **Generar reportes diarios** de ventas por tipo de pago para cuadre de caja

## 📞 Soporte

Para agregar nuevos tipos de pago o modificar los existentes, contacta al administrador del sistema.
