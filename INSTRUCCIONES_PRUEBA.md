# 🧪 INSTRUCCIONES PARA PROBAR EL LOGIN

## 1️⃣ Ejecutar SQL en Supabase

Ve a Supabase Dashboard → SQL Editor y ejecuta el archivo:
```
tienda-multi/supabase/fix_usuario_sebastian.sql
```

Esto asegurará que el usuario esté correctamente asociado a la tienda.

## 2️⃣ Iniciar la App

```bash
cd tienda-multi
npm start
```

## 3️⃣ Probar el Login

1. Abre la app en Expo Go
2. Ingresa las credenciales:
   - Email: `vegasebastian073@gmail.com`
   - Password: `sebas12345`
3. Presiona "Iniciar Sesión"

## 4️⃣ Verificar el Flujo

Deberías ver en la consola:

```
🔄 Cargando datos del usuario: dd372437-8cf1-43b0-aa80-fc316caf6908
✅ Usuario cargado: { ... }
✅ Tiendas cargadas: [ ... ]
📊 Cantidad de tiendas: 1
✅ Seleccionando tienda: { ... }
✅ Loading completado
🔍 Estado final: { session: true, usuario: true, tiendas: 1, loading: false }
➡️ Redirigiendo a dashboard (con tiendas)
```

## 5️⃣ Resultado Esperado

✅ El usuario debe ser redirigido directamente al **Dashboard (tabs)**, NO al onboarding.

## 🐛 Si Sigue Yendo a Onboarding

Verifica en la consola:
- ¿Cuántas tiendas se cargaron? (debe ser 1)
- ¿El loading se completó correctamente?
- ¿Hay algún error en la consulta de tiendas?

## 📝 Cambios Realizados

1. **AuthContext**: Ahora carga las tiendas con JOIN para traer datos completos
2. **index.tsx**: Agregado delay de 100ms para asegurar que el estado esté actualizado
3. **Logs mejorados**: Más información en consola para debugging
4. **SQL fix**: Script para asegurar la asociación usuario-tienda

## 🔍 Verificar en Base de Datos

Si quieres verificar manualmente en Supabase:

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

Debe retornar:
- email: vegasebastian073@gmail.com
- tienda: Tienda Principal
- rol: admin_general
- activo: true
