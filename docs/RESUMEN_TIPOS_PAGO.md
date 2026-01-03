# ✅ Sistema de Tipos de Pago Implementado

## 📦 Lo que se agregó a la base de datos

### 1. Tabla `tipos_pago`
Gestiona los diferentes métodos de pago disponibles:
- **Efectivo** - Pago en efectivo
- **Daviplata** - Billetera digital Daviplata (requiere referencia)
- **Nequi** - Billetera digital Nequi (requiere referencia)
- **Fiado** - Venta a crédito
- **Transferencia** - Transferencia bancaria (requiere referencia)
- **Tarjeta** - Tarjeta débito/crédito (requiere referencia)

Campos principales:
- `codigo`: Identificador único (efectivo, daviplata, nequi, fiado, etc.)
- `requiere_referencia`: Si necesita número de transacción
- `es_credito`: Si es venta a crédito (fiado)
- `color` e `icono`: Para la UI

### 2. Tabla `clientes`
Gestiona clientes para ventas fiadas:
- `limite_credito`: Máximo que puede deber
- `saldo_pendiente`: Deuda actual
- Información de contacto (nombre, teléfono, documento)

### 3. Tabla `pagos_fiados`
Registra abonos a ventas fiadas:
- Vincula venta, cliente y tipo de pago del abono
- Permite pagos parciales
- Actualiza automáticamente el saldo del cliente

### 4. Modificaciones a `ventas`
- `tipo_pago_id`: Referencia al tipo de pago usado
- `cliente_id`: Cliente (solo para fiados)
- `referencia_pago`: Número de transacción (Daviplata, Nequi, etc.)
- `pagada`: Estado de pago (false para fiados pendientes)

### 5. Modificaciones a `sesiones`
- `efectivo_esperado`: Calculado automáticamente
- `diferencia`: Diferencia entre efectivo real y esperado

## 🔄 Triggers Automáticos

### 1. `actualizar_saldo_cliente_venta`
Cuando se crea una venta fiada:
- Aumenta el `saldo_pendiente` del cliente
- Verifica si excede el límite de crédito
- Crea alerta si es necesario

### 2. `actualizar_saldo_cliente_pago`
Cuando se registra un abono:
- Reduce el `saldo_pendiente` del cliente
- Verifica si la venta quedó completamente pagada
- Actualiza el campo `pagada` de la venta

### 3. `verificar_limite_credito`
- Crea alerta cuando un cliente excede su límite
- Tipo de alerta: `movimiento_sospechoso`
- Prioridad: `alta`

### 4. `verificar_venta_pagada`
- Suma todos los abonos de una venta fiada
- Si el total pagado >= total venta, marca como pagada

## 📊 Queries Útiles Incluidos

En `supabase/queries/tipos_pago_queries.sql`:

1. **Ventas por tipo de pago** (día, mes, rango)
2. **Clientes con deuda** (ordenados por monto)
3. **Deudas vencidas** (más de 30 días)
4. **Cuadre de caja** por tipo de pago
5. **Efectivo esperado vs real**
6. **Historial de abonos** por cliente
7. **Tasa de recuperación de cartera**
8. **Funciones auxiliares**:
   - `obtener_saldo_cliente(uuid)` - Resumen de deuda
   - `puede_comprar_fiado(uuid, monto)` - Validar límite
9. **Vista**: `vista_resumen_clientes` - Dashboard de clientes

## 🔐 Seguridad (RLS)

Políticas implementadas:
- Usuarios solo ven tipos de pago de su tienda o globales
- Usuarios solo ven clientes de su tienda
- Usuarios solo ven pagos de fiados de su tienda
- Solo admin_local y admin_general pueden crear tipos de pago personalizados

## 📱 Uso en la App

### Ejemplo: Crear venta en efectivo
```typescript
const { data, error } = await supabase
  .from('ventas')
  .insert({
    tienda_id: tiendaId,
    sesion_id: sesionId,
    usuario_id: userId,
    numero_venta: 'V-001',
    subtotal: 5000,
    total: 5000,
    tipo_pago_id: tipoPagoEfectivoId,
    pagada: true
  });
```

### Ejemplo: Crear venta fiada
```typescript
// 1. Verificar límite de crédito
const { data: puedeComprar } = await supabase
  .rpc('puede_comprar_fiado', {
    p_cliente_id: clienteId,
    p_monto: 50000
  });

if (!puedeComprar) {
  alert('Cliente ha excedido su límite de crédito');
  return;
}

// 2. Crear venta
const { data, error } = await supabase
  .from('ventas')
  .insert({
    tienda_id: tiendaId,
    sesion_id: sesionId,
    usuario_id: userId,
    cliente_id: clienteId,
    numero_venta: 'V-002',
    subtotal: 50000,
    total: 50000,
    tipo_pago_id: tipoPagoFiadoId,
    pagada: false // Importante!
  });

// El trigger automáticamente actualiza el saldo del cliente
```

### Ejemplo: Registrar abono
```typescript
const { data, error } = await supabase
  .from('pagos_fiados')
  .insert({
    tienda_id: tiendaId,
    venta_id: ventaId,
    cliente_id: clienteId,
    usuario_id: userId,
    monto: 20000,
    tipo_pago_id: tipoPagoEfectivoId
  });

// El trigger automáticamente:
// - Reduce el saldo del cliente
// - Verifica si la venta quedó pagada
```

### Ejemplo: Venta con Daviplata/Nequi
```typescript
const { data, error } = await supabase
  .from('ventas')
  .insert({
    tienda_id: tiendaId,
    sesion_id: sesionId,
    usuario_id: userId,
    numero_venta: 'V-003',
    subtotal: 10000,
    total: 10000,
    tipo_pago_id: tipoPagoDaviplataId,
    referencia_pago: '123456789', // Número de transacción
    pagada: true
  });
```

## 📄 Documentación Completa

- **[TIPOS_PAGO.md](./TIPOS_PAGO.md)** - Guía completa del sistema
- **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)** - Configuración paso a paso
- **[tipos_pago_queries.sql](../supabase/queries/tipos_pago_queries.sql)** - Queries útiles

## ✨ Características Destacadas

1. **Extensible**: Cada tienda puede crear sus propios tipos de pago
2. **Automático**: Triggers manejan saldos y estados automáticamente
3. **Seguro**: RLS protege datos por tienda
4. **Auditable**: Historial completo de abonos y cambios
5. **Alertas**: Notificaciones automáticas de límites excedidos
6. **Flexible**: Soporta pagos parciales y múltiples abonos

## 🎯 Próximos Pasos

1. Implementar UI para selección de tipo de pago
2. Crear pantalla de gestión de clientes
3. Implementar pantalla de cobro de fiados
4. Agregar reportes de cartera
5. Implementar notificaciones push para deudas vencidas

---

**Última actualización**: Enero 2026
