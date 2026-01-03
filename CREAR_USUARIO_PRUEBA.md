# 👤 Crear Usuario de Prueba

## Credenciales
- **Email**: vegasebastian073@gmail.com
- **Password**: sebas12345

## 📋 Pasos para Crear el Usuario

### Opción 1: Desde Supabase Dashboard (Más Fácil)

#### 1. Crear Usuario en Auth
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **Authentication** en el menú lateral
3. Click en **Users**
4. Click en **Add user** → **Create new user**
5. Completa:
   - Email: `vegasebastian073@gmail.com`
   - Password: `sebas12345`
   - ✅ **Auto Confirm User** (activar esta opción)
6. Click en **Create user**
7. **IMPORTANTE**: Copia el UUID del usuario (aparece en la columna ID)

#### 2. Ejecutar Script SQL
1. Ve a **SQL Editor** en Supabase
2. Click en **New query**
3. Abre el archivo `supabase/crear_usuario_prueba.sql`
4. **Reemplaza** `'USER_ID_FROM_AUTH'` con el UUID que copiaste (aparece 2 veces)
5. Click en **Run** o presiona `Ctrl+Enter`

#### 3. Verificar
Deberías ver un resultado como:
```
tipo                | detalle
--------------------|------------------
Usuario creado      | vegasebastian073@gmail.com
Tienda creada       | Tienda Sebastian
Categorías creadas  | 5
Productos creados   | 10
Clientes creados    | 3
```

### Opción 2: Script Rápido (Automático)

Si prefieres hacerlo más rápido, ejecuta este script en SQL Editor:

```sql
-- 1. Primero crea el usuario en Auth UI (paso 1 de arriba)
-- 2. Luego ejecuta esto (reemplaza el UUID):

DO $$
DECLARE
  v_user_id UUID := 'PEGA_AQUI_EL_UUID_DEL_USUARIO'; -- ⚠️ CAMBIAR ESTO
  v_tienda_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- Crear perfil
  INSERT INTO usuarios (id, email, nombre_completo, telefono, activo)
  VALUES (v_user_id, 'vegasebastian073@gmail.com', 'Sebastian Vegas', '3001234567', true);
  
  -- Crear tienda
  INSERT INTO tiendas (id, nombre, slug, direccion, telefono, email, activa)
  VALUES (v_tienda_id, 'Tienda Sebastian', 'tienda-sebastian', 'Calle 123 #45-67', '3001234567', 'vegasebastian073@gmail.com', true);
  
  -- Asociar usuario a tienda
  INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol, activo)
  VALUES (v_user_id, v_tienda_id, 'admin_general', true);
  
  -- Crear categorías
  INSERT INTO categorias (tienda_id, nombre, icono, orden) VALUES
    (v_tienda_id, 'Papelería', '📝', 1),
    (v_tienda_id, 'Cervezas', '🍺', 2),
    (v_tienda_id, 'Bebidas', '🥤', 3),
    (v_tienda_id, 'Onces', '🍔', 4),
    (v_tienda_id, 'Snacks', '🍿', 5);
  
  RAISE NOTICE '✅ Usuario y tienda creados correctamente!';
END $$;
```

## 🎯 Probar el Login

1. Abre la app en tu dispositivo
2. En la pantalla de login, ingresa:
   - Email: `vegasebastian073@gmail.com`
   - Password: `sebas12345`
3. Click en **Iniciar Sesión**
4. Deberías ver el dashboard con la tienda "Tienda Sebastian"

## 📊 Datos Incluidos

La tienda viene con:
- ✅ 5 Categorías (Papelería, Cervezas, Bebidas, Onces, Snacks)
- ✅ 3 Proveedores
- ✅ 10 Productos de ejemplo
- ✅ 3 Clientes de ejemplo
- ✅ 6 Tipos de pago (Efectivo, Daviplata, Nequi, Fiado, Transferencia, Tarjeta)

## 🔧 Solución de Problemas

### Error: "Invalid login credentials"
- Verifica que el email y password sean correctos
- Asegúrate de haber activado "Auto Confirm User" al crear el usuario

### Error: "No tienes tiendas"
- Verifica que ejecutaste el script SQL completo
- Verifica que reemplazaste el UUID correctamente

### No aparece la tienda
```sql
-- Verificar que el usuario está asociado a la tienda
SELECT * FROM usuarios_tiendas 
WHERE usuario_id = 'tu-user-id';
```

## 🎉 ¡Listo!

Ahora puedes:
- Explorar el dashboard
- Ver productos
- Crear ventas
- Gestionar clientes
- Ver reportes

---

**Nota**: Este es un usuario de prueba. En producción, los usuarios se registrarán desde la app.
