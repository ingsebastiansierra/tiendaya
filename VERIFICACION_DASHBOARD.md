# ✅ Verificación del Dashboard - Pantalla Principal

## 📋 Checklist de Verificación

### 1. Datos en la Base de Datos

Ejecuta el script `supabase/test_dashboard_queries.sql` en Supabase SQL Editor para verificar:

- ✅ **Productos**: Debe mostrar 60+ productos
- ✅ **Categorías**: Debe mostrar 6 categorías
- ✅ **Clientes**: Debe mostrar 10 clientes
- ✅ **Proveedores**: Debe mostrar 5 proveedores

### 2. Pantalla Principal (Dashboard)

La pantalla principal debe mostrar:

#### 📊 Cards de Estadísticas:

1. **💰 Ventas Hoy**
   - Muestra: `$0` (si no hay ventas hoy)
   - Formato: Pesos colombianos con separador de miles

2. **📦 Productos** (CLICKEABLE)
   - Muestra: `60+` (número total de productos activos)
   - Al hacer click: Abre modal con lista de productos

3. **⚠️ Stock Bajo**
   - Muestra: Cantidad de productos con stock <= stock_minimo
   - Debe ser > 0 (algunos productos tienen stock bajo)

4. **👥 Clientes**
   - Muestra: `10` (total de clientes activos)

#### 🔄 Botón de Refrescar:

- Ubicación: Esquina superior derecha (icono 🔄)
- Función: Recarga las estadísticas desde la base de datos

#### 📱 Modal de Productos:

Al hacer click en la card de "Productos", debe abrir un modal que muestra:

- **Header**: "📦 Mis Productos" con botón de cerrar (✕)
- **Lista de productos** con:
  - Nombre del producto
  - Badge de stock (verde si OK, rojo si bajo)
  - Categoría (con emoji 🏷️)
  - SKU y código de barras
  - Precio en formato colombiano
  - Alerta "⚠️ Stock bajo" si aplica

### 3. Verificación de Conexión

#### En la consola de la app (logs), debes ver:

```
📊 Cargando estadísticas para tienda: 809d8e08-f21e-419e-817d-e232826918f1
✅ Estadísticas cargadas: {
  ventasHoy: 0,
  totalProductos: 60+,
  stockBajo: X,
  totalClientes: 10
}
```

#### Al abrir el modal de productos:

```
📦 Cargando productos para tienda: 809d8e08-f21e-419e-817d-e232826918f1
✅ Productos cargados: 60+
```

### 4. Verificación de Políticas RLS

Si los datos NO se muestran, verifica las políticas RLS:

```sql
-- Ejecuta en Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('productos', 'categorias', 'clientes', 'ventas');
```

Debe haber políticas de tipo `SELECT` para cada tabla.

### 5. Verificación de Usuario-Tienda

Verifica que tu usuario esté asociado a la tienda:

```sql
-- Reemplaza con tu user_id
SELECT 
    ut.*,
    t.nombre as tienda_nombre
FROM usuarios_tiendas ut
JOIN tiendas t ON t.id = ut.tienda_id
WHERE ut.usuario_id = 'TU_USER_ID'
  AND ut.tienda_id = '809d8e08-f21e-419e-817d-e232826918f1';
```

Debe retornar al menos 1 fila con `activo = true`.

## 🐛 Solución de Problemas

### Problema: Las cards muestran 0 en todo

**Causa**: El usuario no tiene acceso a la tienda o las políticas RLS están bloqueando

**Solución**:
1. Verifica que el usuario esté en `usuarios_tiendas` con la tienda correcta
2. Ejecuta `supabase/fix_rls_policies.sql` para corregir políticas

### Problema: El modal de productos está vacío

**Causa**: Error en la consulta o políticas RLS

**Solución**:
1. Revisa los logs de la consola para ver el error específico
2. Verifica que la tabla `productos` tenga datos con el `tienda_id` correcto
3. Ejecuta `supabase/test_dashboard_queries.sql` para verificar las consultas

### Problema: "No hay tienda seleccionada"

**Causa**: El contexto de autenticación no tiene `tiendaActual`

**Solución**:
1. Verifica que el usuario tenga tiendas en `usuarios_tiendas`
2. Revisa el `AuthContext` para ver si está cargando las tiendas correctamente
3. Cierra sesión y vuelve a iniciar sesión

## 📝 Datos de Prueba

### Tienda Principal:
- **ID**: `809d8e08-f21e-419e-817d-e232826918f1`
- **Nombre**: Tienda Principal

### Categorías creadas:
1. 🥤 Bebidas (10 productos)
2. 🍿 Snacks (12 productos)
3. 🥛 Lácteos (8 productos)
4. 🧹 Aseo (8 productos)
5. 🍞 Panadería (6 productos)
6. 🍎 Frutas y Verduras (8 productos)

### Productos destacados:
- Coca-Cola 400ml - $2,500
- Papas Margarita 50g - $1,500
- Leche Alpina 1L - $4,000
- Pan Tajado Bimbo - $4,000

## ✅ Checklist Final

- [ ] Las 4 cards del dashboard muestran números correctos
- [ ] El botón de refrescar (🔄) recarga los datos
- [ ] Al hacer click en "Productos" se abre el modal
- [ ] El modal muestra 60+ productos
- [ ] Los productos muestran categoría, precio y stock
- [ ] Los productos con stock bajo tienen badge rojo
- [ ] Los logs en consola muestran datos cargados correctamente
- [ ] No hay errores en la consola

## 🎯 Resultado Esperado

Al abrir la app y llegar al dashboard, debes ver:

```
💰 Ventas Hoy: $0
📦 Productos: 62
⚠️ Stock Bajo: 5-10
👥 Clientes: 10
```

Y al hacer click en "Productos", ver una lista completa con todos los productos organizados por categoría.
