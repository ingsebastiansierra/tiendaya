# ⚙️ Configuración de Supabase - Guía Paso a Paso

## 1. CREAR PROYECTO EN SUPABASE

### 1.1 Registro
1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click en "New Project"

### 1.2 Configuración del Proyecto
```
Nombre: tienda-multi-prod
Database Password: [genera una contraseña segura]
Region: South America (São Paulo) - más cercana a Colombia
Pricing Plan: Free (para desarrollo)
```

### 1.3 Esperar Provisión
- El proyecto tarda ~2 minutos en estar listo
- Verás un indicador de progreso

## 2. EJECUTAR ESQUEMA DE BASE DE DATOS

### 2.1 Abrir SQL Editor
1. En el panel izquierdo, click en "SQL Editor"
2. Click en "New Query"

### 2.2 Copiar y Ejecutar Schema
1. Abre el archivo `supabase/schema.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor
4. Click en "Run" (o Ctrl+Enter)

### 2.3 Verificar Creación
Deberías ver:
```
✅ Extensions created
✅ Tables created (13 tablas)
✅ Indexes created
✅ Triggers created
✅ RLS policies created
```

## 3. CONFIGURAR AUTENTICACIÓN

### 3.1 Habilitar Proveedores
1. Ve a "Authentication" > "Providers"
2. Habilita "Email"
3. Configuración recomendada:
   - Enable email confirmations: ❌ (para desarrollo)
   - Enable email confirmations: ✅ (para producción)
   - Secure email change: ✅
   - Secure password change: ✅

### 3.2 Configurar Email Templates (Opcional)
1. Ve a "Authentication" > "Email Templates"
2. Personaliza los templates:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### 3.3 Configurar URL Redirects
```
Site URL: http://localhost:8081 (desarrollo)
Redirect URLs:
  - http://localhost:8081/**
  - tiendamulti://** (deep linking)
  - https://tudominio.com/** (producción)
```

## 4. OBTENER CREDENCIALES

### 4.1 API Keys
1. Ve a "Settings" > "API"
2. Copia las siguientes credenciales:

```env
# Project URL
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Anon/Public Key (segura para cliente)
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (NUNCA exponer en cliente)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 Configurar .env
1. Copia `.env.example` a `.env`
2. Pega las credenciales:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## 5. CREAR DATOS DE PRUEBA

### 5.1 Crear Primera Tienda
```sql
-- Ejecutar en SQL Editor
INSERT INTO tiendas (nombre, slug, direccion, telefono, email)
VALUES (
  'Tienda Demo',
  'tienda-demo',
  'Calle 123 #45-67, Bogotá',
  '3001234567',
  'demo@tiendamulti.com'
);
```

### 5.2 Crear Usuario de Prueba
1. Ve a "Authentication" > "Users"
2. Click en "Add user" > "Create new user"
3. Completa:
   ```
   Email: admin@tiendamulti.com
   Password: Admin123!
   Auto Confirm User: ✅
   ```

### 5.3 Asociar Usuario a Tienda
```sql
-- Obtener IDs
SELECT id, email FROM auth.users WHERE email = 'admin@tiendamulti.com';
SELECT id, nombre FROM tiendas WHERE slug = 'tienda-demo';

-- Crear registro en usuarios
INSERT INTO usuarios (id, email, nombre_completo, activo)
VALUES (
  'user-id-from-auth',
  'admin@tiendamulti.com',
  'Administrador Demo',
  true
);

-- Asociar a tienda con rol
INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol, activo)
VALUES (
  'user-id-from-auth',
  'tienda-id-from-tiendas',
  'admin_general',
  true
);
```

### 5.4 Crear Categorías de Ejemplo
```sql
-- Obtener tienda_id
SELECT id FROM tiendas WHERE slug = 'tienda-demo';

-- Insertar categorías
INSERT INTO categorias (tienda_id, nombre, icono, orden) VALUES
  ('tienda-id', 'Papelería', 'document-text', 1),
  ('tienda-id', 'Cervezas', 'beer', 2),
  ('tienda-id', 'Bebidas', 'water', 3),
  ('tienda-id', 'Onces', 'fast-food', 4);
```

### 5.5 Crear Proveedores de Ejemplo
```sql
INSERT INTO proveedores (tienda_id, nombre, contacto, telefono) VALUES
  ('tienda-id', 'Distribuidora ABC', 'Juan Pérez', '3101234567'),
  ('tienda-id', 'Papelería Central', 'María García', '3209876543'),
  ('tienda-id', 'Bebidas del Valle', 'Carlos López', '3158765432');
```

### 5.6 Crear Productos de Ejemplo
```sql
-- Obtener IDs de categorías y proveedores
SELECT id, nombre FROM categorias WHERE tienda_id = 'tienda-id';
SELECT id, nombre FROM proveedores WHERE tienda_id = 'tienda-id';

-- Insertar productos
INSERT INTO productos (
  tienda_id, categoria_id, proveedor_id,
  nombre, precio_compra, precio_venta,
  stock_actual, stock_minimo, stock_maximo
) VALUES
  -- Papelería
  ('tienda-id', 'cat-papeleria-id', 'prov-papeleria-id',
   'Cuaderno 100 hojas', 3000, 5000, 20, 5, 50),
  ('tienda-id', 'cat-papeleria-id', 'prov-papeleria-id',
   'Lapicero BIC', 800, 1500, 50, 10, 100),
  
  -- Cervezas
  ('tienda-id', 'cat-cervezas-id', 'prov-bebidas-id',
   'Cerveza Poker 330ml', 1800, 3000, 24, 12, 48),
  ('tienda-id', 'cat-cervezas-id', 'prov-bebidas-id',
   'Cerveza Águila 330ml', 1800, 3000, 24, 12, 48),
  
  -- Bebidas
  ('tienda-id', 'cat-bebidas-id', 'prov-bebidas-id',
   'Coca Cola 400ml', 1500, 2500, 30, 15, 60),
  ('tienda-id', 'cat-bebidas-id', 'prov-bebidas-id',
   'Agua Cristal 600ml', 800, 1500, 40, 20, 80),
  
  -- Onces
  ('tienda-id', 'cat-onces-id', 'prov-abc-id',
   'Empanada de carne', 1000, 2000, 10, 5, 20),
  ('tienda-id', 'cat-onces-id', 'prov-abc-id',
   'Papas Margarita', 1200, 2000, 25, 10, 50);
```

### 5.7 Verificar Tipos de Pago
Los tipos de pago se crean automáticamente al ejecutar el schema:
```sql
-- Ver tipos de pago disponibles
SELECT * FROM tipos_pago ORDER BY orden;

-- Deberías ver:
-- ✅ Efectivo
-- ✅ Daviplata
-- ✅ Nequi
-- ✅ Fiado
-- ✅ Transferencia
-- ✅ Tarjeta
```

### 5.8 Crear Clientes de Prueba (Para Fiados)
```sql
-- Crear clientes con límite de crédito
INSERT INTO clientes (
  tienda_id, nombre_completo, telefono, documento,
  limite_credito, saldo_pendiente
) VALUES
  ('tienda-id', 'Juan Pérez', '3001234567', '1234567890', 500000, 0),
  ('tienda-id', 'María García', '3109876543', '0987654321', 300000, 0),
  ('tienda-id', 'Carlos López', '3158765432', '5555555555', 200000, 0);
```

## 6. PROBAR SISTEMA DE PAGOS

### 6.1 Venta en Efectivo
```sql
-- Crear sesión
INSERT INTO sesiones (tienda_id, usuario_id, efectivo_inicial)
VALUES ('tienda-id', 'user-id', 50000)
RETURNING id;

-- Crear venta en efectivo
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id, numero_venta,
  subtotal, total, tipo_pago_id, pagada
) VALUES (
  'tienda-id',
  'sesion-id',
  'user-id',
  'V-001',
  5000,
  5000,
  (SELECT id FROM tipos_pago WHERE codigo = 'efectivo'),
  true
);
```

### 6.2 Venta con Daviplata/Nequi
```sql
-- Venta con Daviplata (requiere referencia)
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id, numero_venta,
  subtotal, total, tipo_pago_id, referencia_pago, pagada
) VALUES (
  'tienda-id',
  'sesion-id',
  'user-id',
  'V-002',
  10000,
  10000,
  (SELECT id FROM tipos_pago WHERE codigo = 'daviplata'),
  '123456789', -- Número de transacción
  true
);
```

### 6.3 Venta Fiada
```sql
-- Crear venta fiada
INSERT INTO ventas (
  tienda_id, sesion_id, usuario_id, cliente_id, numero_venta,
  subtotal, total, tipo_pago_id, pagada
) VALUES (
  'tienda-id',
  'sesion-id',
  'user-id',
  'cliente-id', -- ID del cliente
  'V-003',
  50000,
  50000,
  (SELECT id FROM tipos_pago WHERE codigo = 'fiado'),
  false -- No está pagada
)
RETURNING id;

-- Verificar que se actualizó el saldo del cliente
SELECT nombre_completo, saldo_pendiente 
FROM clientes 
WHERE id = 'cliente-id';
-- Debería mostrar saldo_pendiente = 50000
```

### 6.4 Registrar Abono a Fiado
```sql
-- Cliente abona $20,000 en efectivo
INSERT INTO pagos_fiados (
  tienda_id, venta_id, cliente_id, usuario_id,
  monto, tipo_pago_id
) VALUES (
  'tienda-id',
  'venta-fiada-id',
  'cliente-id',
  'user-id',
  20000,
  (SELECT id FROM tipos_pago WHERE codigo = 'efectivo')
);

-- Verificar saldo actualizado
SELECT nombre_completo, saldo_pendiente 
FROM clientes 
WHERE id = 'cliente-id';
-- Debería mostrar saldo_pendiente = 30000 (50000 - 20000)
```

## 7. VERIFICAR RLS (Row Level Security)

### 7.1 Probar Políticas
```sql
-- Cambiar a rol de usuario autenticado
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-id-from-auth"}';

-- Intentar ver productos (debería funcionar)
SELECT * FROM productos;

-- Intentar ver productos de otra tienda (debería estar vacío)
SELECT * FROM productos WHERE tienda_id = 'otra-tienda-id';

-- Volver a rol admin
RESET ROLE;
```

### 7.2 Verificar Triggers
```sql
-- Crear una venta de prueba
INSERT INTO ventas (
  tienda_id, usuario_id, numero_venta,
  subtotal, total, metodo_pago
) VALUES (
  'tienda-id',
  'user-id',
  'V-001',
  5000,
  5000,
  'efectivo'
);

-- Agregar detalle (debería reducir stock automáticamente)
INSERT INTO ventas_detalle (
  venta_id, producto_id, cantidad, precio_unitario, subtotal
) VALUES (
  'venta-id',
  'producto-id',
  2,
  2500,
  5000
);

-- Verificar que se creó movimiento de inventario
SELECT * FROM movimientos_inventario 
WHERE producto_id = 'producto-id'
ORDER BY created_at DESC
LIMIT 1;

-- Verificar que se redujo el stock
SELECT nombre, stock_actual 
FROM productos 
WHERE id = 'producto-id';
```

## 8. CONFIGURAR REALTIME (Opcional)

### 8.1 Habilitar Realtime en Tablas
1. Ve a "Database" > "Replication"
2. Habilita replicación para:
   - productos
   - ventas
   - alertas
   - movimientos_inventario

### 8.2 Probar Realtime
```typescript
// En tu app
const channel = supabase
  .channel('productos-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'productos',
    },
    (payload) => {
      console.log('Cambio detectado:', payload);
    }
  )
  .subscribe();
```

## 9. CONFIGURAR STORAGE (Para imágenes)

### 9.1 Crear Bucket
1. Ve a "Storage"
2. Click en "New bucket"
3. Configuración:
   ```
   Name: productos
   Public: ✅
   File size limit: 5MB
   Allowed MIME types: image/jpeg, image/png, image/webp
   ```

### 9.2 Configurar Políticas de Storage
```sql
-- Permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

-- Permitir subida solo a usuarios autenticados
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'productos' 
  AND auth.role() = 'authenticated'
);
```

## 10. MONITOREO Y LOGS

### 10.1 Ver Logs
1. Ve a "Logs" > "Postgres Logs"
2. Filtra por:
   - Errores
   - Queries lentas
   - Conexiones

### 10.2 Configurar Alertas (Plan Pro)
1. Ve a "Settings" > "Alerts"
2. Configura alertas para:
   - CPU > 80%
   - Memoria > 80%
   - Conexiones > 90%

## 11. BACKUP Y RECUPERACIÓN

### 11.1 Backups Automáticos
- Plan Free: 7 días de backups
- Plan Pro: 30 días de backups
- Plan Enterprise: Personalizado

### 11.2 Backup Manual
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Backup
supabase db dump -f backup.sql
```

### 11.3 Restaurar Backup
```bash
# Restaurar desde archivo
supabase db reset
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f backup.sql
```

## 12. MIGRACIÓN A PRODUCCIÓN

### 12.1 Crear Proyecto de Producción
1. Crear nuevo proyecto en Supabase
2. Ejecutar mismo schema
3. Configurar variables de entorno de producción

### 12.2 Migrar Datos
```bash
# Exportar desde desarrollo
supabase db dump -f dev-data.sql

# Importar a producción
psql -h prod-db.supabase.co -U postgres -d postgres -f dev-data.sql
```

### 12.3 Actualizar App
```env
# .env.production
EXPO_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
```

## 13. TROUBLESHOOTING

### Problema: No puedo conectarme
```bash
# Verificar conectividad
curl https://xxxxx.supabase.co/rest/v1/

# Verificar API key
curl -H "apikey: tu-anon-key" https://xxxxx.supabase.co/rest/v1/productos
```

### Problema: RLS bloquea queries
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'productos';

-- Deshabilitar RLS temporalmente (solo desarrollo)
ALTER TABLE productos DISABLE ROW LEVEL SECURITY;
```

### Problema: Triggers no funcionan
```sql
-- Verificar triggers
SELECT * FROM pg_trigger WHERE tgname LIKE '%stock%';

-- Ver logs de errores
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%productos%'
ORDER BY calls DESC;
```

## 14. RECURSOS ADICIONALES

- [Documentación Oficial](https://supabase.com/docs)
- [Guía de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Storage](https://supabase.com/docs/guides/storage)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- **[Sistema de Tipos de Pago](./TIPOS_PAGO.md)** - Guía completa de efectivo, Daviplata, Nequi y fiados

---

**¿Problemas?** Revisa los logs en Supabase Dashboard o contacta soporte.

**Última actualización**: Enero 2026
