# 🏗️ Arquitectura Técnica - Tienda Multi

## 1. VISIÓN GENERAL

### 1.1 Arquitectura Multi-Tenant

La aplicación utiliza un modelo **multi-tenant por fila** donde:
- Cada registro tiene un `tienda_id` que identifica a qué tienda pertenece
- Row Level Security (RLS) garantiza el aislamiento de datos
- Un usuario puede pertenecer a múltiples tiendas con diferentes roles

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE CLIENTE                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Expo App (React Native + TypeScript)            │  │
│  │  - Zustand (Estado global)                       │  │
│  │  - React Hook Form + Zod (Validación)           │  │
│  │  - Expo Router (Navegación)                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ HTTPS/WSS
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE BACKEND                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Supabase Auth (JWT + Roles)                     │  │
│  │  - Autenticación con email/password              │  │
│  │  - Tokens JWT con claims personalizados          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PostgreSQL + RLS                                │  │
│  │  - Multi-tenant por fila                         │  │
│  │  - Políticas RLS por rol                         │  │
│  │  - Triggers automáticos                          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Supabase Realtime                               │  │
│  │  - Suscripciones a cambios                       │  │
│  │  - Alertas en tiempo real                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 2. CAPA DE DATOS

### 2.1 Modelo de Datos

#### Entidades Core

**Tiendas**
- Entidad principal del multi-tenant
- Cada tienda es independiente
- Configuración personalizable por tienda

**Usuarios y Roles**
- Un usuario puede tener múltiples roles en diferentes tiendas
- Tabla `usuarios_tiendas` como tabla pivote
- 4 roles predefinidos con permisos específicos

**Productos e Inventario**
- Stock en tiempo real
- Topes mínimos y máximos configurables
- Asociación con proveedores

**Proveedores**
- Gestión por tienda
- Múltiples productos por proveedor
- Historial de pedidos

### 2.2 Relaciones Clave

```sql
tiendas (1) ──< (N) usuarios_tiendas (N) >── (1) usuarios
tiendas (1) ──< (N) productos
tiendas (1) ──< (N) proveedores
proveedores (1) ──< (N) productos
productos (1) ──< (N) ventas_detalle
ventas (1) ──< (N) ventas_detalle
productos (1) ──< (N) movimientos_inventario
```

### 2.3 Índices Estratégicos

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_productos_tienda ON productos(tienda_id);
CREATE INDEX idx_productos_stock_bajo ON productos(tienda_id, stock_actual) 
  WHERE stock_actual <= stock_minimo;

-- Reportes
CREATE INDEX idx_ventas_fecha ON ventas(created_at);
CREATE INDEX idx_ventas_tienda ON ventas(tienda_id);

-- Auditoría
CREATE INDEX idx_logs_fecha ON logs_auditoria(created_at);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
```

## 3. SEGURIDAD

### 3.1 Row Level Security (RLS)

Todas las tablas tienen RLS habilitado con políticas específicas:

```sql
-- Ejemplo: Productos
CREATE POLICY "usuarios_productos_select" ON productos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_tiendas ut
      WHERE ut.usuario_id = auth.uid()
        AND ut.tienda_id = productos.tienda_id
        AND ut.activo = true
    )
  );
```

### 3.2 Matriz de Permisos

| Recurso | admin_general | dueño_local | admin_local | admin_asistente |
|---------|--------------|-------------|-------------|-----------------|
| **Productos** |
| SELECT | ✅ | ✅ | ✅ | ✅ |
| INSERT | ✅ | ❌ | ✅ | ❌ |
| UPDATE (stock) | ✅ | ❌ | ✅ | ❌ |
| UPDATE (precios) | ✅ | ❌ | ❌ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ |
| **Ventas** |
| SELECT | ✅ | ✅ | ✅ | ✅ |
| INSERT | ✅ | ❌ | ✅ | ✅ |
| UPDATE | ✅ | ❌ | ✅ | ❌ |
| DELETE | ✅ | ❌ | ❌ | ❌ |
| **Gastos** |
| SELECT | ✅ | ✅ | ✅ | ✅ |
| INSERT | ✅ | ❌ | ✅ | ✅ |
| APROBAR | ✅ | ✅ | ❌ | ❌ |
| **Logs** |
| SELECT | ✅ | ✅ | ❌ | ❌ |

### 3.3 Auditoría y Antifraude

**Logs Automáticos**
- Todos los cambios críticos se registran
- Datos anteriores y nuevos en formato JSONB
- IP y user agent del cliente
- Timestamp preciso

**Triggers de Auditoría**
```sql
-- Registrar cambios de precio
CREATE TRIGGER trigger_registrar_cambio_precio
  AFTER UPDATE ON productos
  FOR EACH ROW
  WHEN (OLD.precio_venta != NEW.precio_venta)
  EXECUTE FUNCTION registrar_cambio_precio();
```

**Detección de Anomalías**
- Ventas grandes fuera de horario
- Múltiples cambios de precio en corto tiempo
- Diferencias significativas en cierre de caja
- Eliminaciones masivas

## 4. CAPA DE APLICACIÓN

### 4.1 Gestión de Estado (Zustand)

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  usuario: Usuario | null;
  tiendaActual: string | null;
  rolActual: UsuarioTienda | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// inventarioStore.ts
interface InventarioState {
  productos: Producto[];
  productosFaltantes: Producto[];
  fetchProductos: (tiendaId: string) => Promise<void>;
  actualizarStock: (productoId: string, cantidad: number) => Promise<void>;
}
```

### 4.2 Validación con Zod

```typescript
import { z } from 'zod';

const productoSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  precio_venta: z.number().positive('Debe ser mayor a 0'),
  stock_minimo: z.number().min(0),
  stock_maximo: z.number().min(0),
}).refine(data => data.stock_maximo >= data.stock_minimo, {
  message: 'Stock máximo debe ser mayor o igual al mínimo',
  path: ['stock_maximo'],
});
```

### 4.3 Navegación (Expo Router)

```
app/
├── (auth)/
│   └── login.tsx          # Pantalla de login
├── (tabs)/
│   ├── _layout.tsx        # Layout con tabs
│   ├── index.tsx          # Dashboard
│   ├── inventario.tsx     # Gestión de inventario
│   ├── ventas.tsx         # Registro de ventas
│   ├── proveedores.tsx    # Gestión de proveedores
│   └── alertas.tsx        # Notificaciones
└── _layout.tsx            # Layout raíz
```

## 5. FUNCIONALIDADES CLAVE

### 5.1 Sistema de Alertas

**Tipos de Alertas**
1. **Stock Bajo**: Cuando `stock_actual <= stock_minimo`
2. **Stock Agotado**: Cuando `stock_actual = 0`
3. **Pedido Grande**: Ventas > umbral configurado
4. **Movimiento Sospechoso**: Patrones anómalos
5. **Sesión Abierta**: Sesiones sin cerrar > 24h
6. **Diferencia Caja**: Diferencia > tolerancia

**Trigger Automático**
```sql
CREATE TRIGGER trigger_verificar_stock_bajo
  AFTER UPDATE OF stock_actual ON productos
  FOR EACH ROW
  WHEN (OLD.stock_actual IS DISTINCT FROM NEW.stock_actual)
  EXECUTE FUNCTION verificar_stock_bajo();
```

### 5.2 Gestión de Inventario

**Cálculo de Faltantes**
```sql
-- Productos que necesitan pedido
SELECT 
  p.*,
  pr.nombre as proveedor_nombre,
  (p.stock_maximo - p.stock_actual) as cantidad_sugerida
FROM productos p
LEFT JOIN proveedores pr ON pr.id = p.proveedor_id
WHERE p.tienda_id = $1
  AND p.stock_actual <= p.stock_minimo
  AND p.activo = true
ORDER BY p.stock_actual ASC;
```

**Movimientos Automáticos**
- Cada venta genera un movimiento de salida
- Cada pedido recibido genera entrada
- Ajustes manuales con motivo obligatorio

### 5.3 Sesiones de Caja

**Flujo de Sesión**
1. Apertura con efectivo inicial
2. Registro de ventas y gastos
3. Cierre con conteo de efectivo
4. Cálculo automático de diferencia

```typescript
const diferencia = efectivo_final - (efectivo_inicial + total_ventas - total_gastos);
```

## 6. OPTIMIZACIONES

### 6.1 Performance

**Consultas Optimizadas**
- Índices en columnas de búsqueda frecuente
- Paginación en listados grandes
- Carga lazy de imágenes
- Cache de datos estáticos

**Realtime Selectivo**
- Solo suscribirse a cambios relevantes
- Filtrar por tienda_id
- Desuscribirse al salir de pantalla

### 6.2 Escalabilidad

**Horizontal**
- Supabase escala automáticamente
- Connection pooling habilitado
- CDN para assets estáticos

**Vertical**
- Particionamiento de tablas grandes (futuro)
- Archivado de datos históricos
- Índices parciales para queries específicos

## 7. MONITOREO Y OBSERVABILIDAD

### 7.1 Métricas Clave

- Tiempo de respuesta de queries
- Tasa de errores
- Usuarios activos concurrentes
- Uso de almacenamiento
- Alertas generadas por día

### 7.2 Logs

```sql
-- Consultar logs de auditoría
SELECT 
  l.*,
  u.nombre_completo,
  t.nombre as tienda_nombre
FROM logs_auditoria l
LEFT JOIN usuarios u ON u.id = l.usuario_id
LEFT JOIN tiendas t ON t.id = l.tienda_id
WHERE l.created_at >= NOW() - INTERVAL '7 days'
ORDER BY l.created_at DESC;
```

## 8. DESPLIEGUE

### 8.1 Ambientes

- **Desarrollo**: Local con Supabase local
- **Staging**: Supabase proyecto de pruebas
- **Producción**: Supabase proyecto principal

### 8.2 CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: eas build --platform all
```

## 9. RIESGOS Y MITIGACIONES

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Pérdida de datos | Alto | Baja | Backups automáticos diarios |
| Acceso no autorizado | Alto | Media | RLS + Auditoría completa |
| Caída de Supabase | Alto | Baja | Modo offline + sincronización |
| Fraude interno | Medio | Media | Logs + Alertas automáticas |
| Escalabilidad | Medio | Media | Arquitectura multi-tenant |

## 10. PRÓXIMOS PASOS

### Fase 2: Q2 2026
- [ ] Reportes avanzados con gráficas
- [ ] Notificaciones push
- [ ] Modo offline completo
- [ ] Integración con lectores de código de barras

### Fase 3: Q3 2026
- [ ] Multi-sucursal
- [ ] API pública REST
- [ ] Webhooks para integraciones
- [ ] Dashboard web administrativo

### Fase 4: Q4 2026
- [ ] Machine Learning para predicción de demanda
- [ ] Detección de fraude con IA
- [ ] Integración con sistemas contables
- [ ] App para proveedores

---

**Última actualización**: Enero 2026
