# 🔐 SOLUCIÓN: Problema con RLS (Row Level Security)

## 🐛 Problema Real

El usuario `vegasebastian073@gmail.com` está siendo redirigido al onboarding porque **NO PUEDE LEER** sus propias tiendas de la base de datos.

### Causa Raíz

Las tablas `usuarios_tiendas` y `tiendas` tienen **RLS habilitado** pero **NO tienen políticas** que permitan a los usuarios leer sus propios datos.

```sql
-- RLS está habilitado
ALTER TABLE usuarios_tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiendas ENABLE ROW LEVEL SECURITY;

-- ❌ PERO NO HAY POLÍTICAS PARA ESTAS TABLAS
-- Resultado: NADIE puede leer de estas tablas
```

## ✅ Solución

Ejecutar el script `fix_rls_policies.sql` en Supabase para agregar las políticas faltantes.

### Paso 1: Ir a Supabase Dashboard

1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor**

### Paso 2: Ejecutar el Script

Copia y pega el contenido de `tienda-multi/supabase/fix_rls_policies.sql` y ejecuta.

O ejecuta estos comandos directamente:

```sql
-- Política para usuarios_tiendas (CRÍTICO)
CREATE POLICY "usuarios_tiendas_select_own" ON usuarios_tiendas
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "usuarios_tiendas_insert_own" ON usuarios_tiendas
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Política para tiendas
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

-- Políticas para proveedores
CREATE POLICY "proveedores_select" ON proveedores
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));

CREATE POLICY "proveedores_update" ON proveedores
  FOR UPDATE
  USING (tiene_acceso_tienda(tienda_id));

-- Políticas para gastos
CREATE POLICY "gastos_select" ON gastos
  FOR SELECT
  USING (tiene_acceso_tienda(tienda_id));

CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT
  WITH CHECK (tiene_acceso_tienda(tienda_id));
```

### Paso 3: Verificar

Ejecuta el script `test_rls.sql` para verificar que las políticas funcionan:

```sql
-- Debe retornar ✅ PASS en todos los tests
SELECT * FROM test_rls;
```

### Paso 4: Probar la App

1. Cierra la app completamente
2. Vuelve a iniciar: `npm start`
3. Login con: `vegasebastian073@gmail.com` / `sebas12345`
4. Ahora debe ir directo al **Dashboard**

## 📊 Qué Hacen las Políticas

### `usuarios_tiendas_select_own`
Permite que un usuario lea sus propias asociaciones de tiendas:
```sql
WHERE auth.uid() = usuario_id
```

### `tiendas_select`
Permite que un usuario lea los datos de las tiendas a las que tiene acceso:
```sql
WHERE EXISTS (
  SELECT 1 FROM usuarios_tiendas 
  WHERE usuario_id = auth.uid() 
    AND tienda_id = tiendas.id
)
```

## 🔍 Cómo Verificar si Funcionó

En la consola de la app deberías ver:

```
🔄 Cargando datos del usuario: dd372437-8cf1-43b0-aa80-fc316caf6908
✅ Usuario cargado: { ... }
✅ Tiendas cargadas: [ { id: '...', tienda_id: '...', rol: 'admin_general', ... } ]
📊 Cantidad de tiendas: 1
✅ Seleccionando tienda: { ... }
✅ Loading completado
🔍 Estado final: { session: true, usuario: true, tiendas: 1, loading: false }
➡️ Redirigiendo a dashboard (con tiendas)
```

## ⚠️ Importante

Sin estas políticas RLS, **NINGÚN USUARIO** puede leer sus tiendas, incluso si están correctamente asociadas en la base de datos.

RLS es una capa de seguridad de PostgreSQL que filtra las filas según el usuario autenticado. Si no hay políticas, el resultado es **0 filas** siempre.

## 📁 Archivos Relacionados

- ✏️ `tienda-multi/supabase/fix_rls_policies.sql` - Script para agregar políticas
- ✏️ `tienda-multi/supabase/test_rls.sql` - Script para verificar políticas
- ✏️ `tienda-multi/supabase/schema.sql` - Schema principal (actualizar después)
