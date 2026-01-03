# 🔧 Solución: Usuario redirige a onboarding en lugar de dashboard

## 🎯 Problema
Cuando inicias sesión con `vegasebastian073@gmail.com`, la app te envía al onboarding (3 pasos para crear tienda) en lugar de ir directamente al dashboard, aunque ya tengas una tienda creada.

## 🔍 Causa
El problema está en que la relación entre el usuario y la tienda no existe o no está correctamente configurada en la tabla `usuarios_tiendas`.

## ✅ Solución

### Paso 1: Verificar el estado actual

Ejecuta este script en Supabase SQL Editor:

```sql
-- Ver si el usuario existe en auth
SELECT id, email FROM auth.users 
WHERE email = 'vegasebastian073@gmail.com';

-- Ver si el usuario tiene perfil
SELECT id, email, nombre_completo FROM usuarios 
WHERE email = 'vegasebastian073@gmail.com';

-- Ver las tiendas disponibles
SELECT id, nombre, slug FROM tiendas;

-- Ver la relación usuario-tienda (ESTE ES EL PROBLEMA)
SELECT 
  ut.*,
  t.nombre as tienda_nombre,
  u.email as usuario_email
FROM usuarios_tiendas ut
JOIN tiendas t ON t.id = ut.tienda_id
JOIN usuarios u ON u.id = ut.usuario_id
WHERE u.email = 'vegasebastian073@gmail.com';
```

### Paso 2: Ejecutar el script de corrección

Ejecuta el archivo `verificar_usuario_tienda.sql` que acabo de crear:

```bash
# En Supabase SQL Editor, ejecuta:
tienda-multi/supabase/verificar_usuario_tienda.sql
```

Este script:
1. ✅ Verifica que el usuario existe en `auth.users`
2. ✅ Crea el perfil en `usuarios` si no existe
3. ✅ Crea la tienda si no existe
4. ✅ Crea la relación en `usuarios_tiendas` con rol `admin_general`

### Paso 3: Verificar que funcionó

Después de ejecutar el script, verifica:

```sql
SELECT 
  u.email,
  u.nombre_completo,
  t.nombre as tienda,
  ut.rol,
  ut.activo
FROM usuarios u
JOIN usuarios_tiendas ut ON ut.usuario_id = u.id
JOIN tiendas t ON t.id = ut.tienda_id
WHERE u.email = 'vegasebastian073@gmail.com';
```

Deberías ver algo como:
```
email: vegasebastian073@gmail.com
nombre_completo: Sebastian Vegas
tienda: Tienda Sebastian
rol: admin_general
activo: true
```

### Paso 4: Probar en la app

1. Cierra sesión en la app (si estás logueado)
2. Vuelve a iniciar sesión con:
   - Email: `vegasebastian073@gmail.com`
   - Password: `sebas12345`
3. Ahora deberías ir directamente al dashboard (tabs) en lugar del onboarding

## 🐛 Debug adicional

Si aún no funciona, agrega logs temporales en `AuthContext.tsx`:

```typescript
const loadUserData = async (userId: string) => {
  try {
    console.log('🔄 Cargando datos del usuario:', userId);

    // ... código existente ...

    // Después de cargar tiendas
    console.log('📊 Tiendas cargadas:', tiendasData);
    console.log('📊 Cantidad de tiendas:', tiendasData?.length || 0);
    
    if (tiendasData && tiendasData.length > 0) {
      console.log('✅ Primera tienda:', tiendasData[0]);
    } else {
      console.log('❌ No hay tiendas para este usuario');
    }
  } catch (error) {
    console.error('❌ Error loading user data:', error);
  }
};
```

Revisa la consola de React Native para ver qué está pasando.

## 📝 Notas importantes

1. **RLS (Row Level Security)**: Las políticas RLS están configuradas para que solo puedas ver las tiendas a las que tienes acceso a través de `usuarios_tiendas`.

2. **Función `tiene_acceso_tienda`**: Esta función verifica que exista un registro activo en `usuarios_tiendas` para el usuario actual.

3. **Flujo de navegación** en `app/index.tsx`:
   ```typescript
   // Sin sesión → Login
   if (!session) return <Redirect href="/(auth)/login" />;
   
   // Con sesión pero sin tiendas → Onboarding
   if (tiendas.length === 0) return <Redirect href="/onboarding" />;
   
   // Con sesión y tiendas → Dashboard
   return <Redirect href="/(tabs)" />;
   ```

## 🎉 Resultado esperado

Después de aplicar la solución:
- ✅ El usuario inicia sesión
- ✅ El `AuthContext` carga las tiendas desde `usuarios_tiendas`
- ✅ Encuentra al menos 1 tienda
- ✅ Redirige automáticamente a `/(tabs)` (dashboard)
- ✅ No muestra el onboarding
