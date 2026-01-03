# ⚡ ARREGLO RÁPIDO - 2 MINUTOS

## 🐛 Problema
Tu usuario tiene tienda en la base de datos, pero la app lo manda al onboarding porque **no puede leer** sus tiendas debido a políticas RLS faltantes.

## ✅ Solución (2 pasos)

### 1️⃣ Ejecutar SQL en Supabase (1 minuto)

1. Abre: https://supabase.com/dashboard
2. Ve a: **SQL Editor**
3. Copia y pega el archivo: `tienda-multi/supabase/EJECUTAR_ESTO.sql`
4. Click en **Run**

### 2️⃣ Probar la App (1 minuto)

```bash
# En la terminal
cd tienda-multi
npm start
```

Login con:
- Email: `vegasebastian073@gmail.com`
- Password: `sebas12345`

## 🎯 Resultado Esperado

✅ Debe ir directo al **Dashboard**, NO al onboarding

## 📝 Qué Hace el Script

Agrega políticas RLS que permiten:
- Que los usuarios lean sus propias tiendas
- Que los usuarios lean los datos de las tiendas a las que tienen acceso
- Que los usuarios creen nuevas tiendas (onboarding)

## 🔍 Si Sigue Fallando

Verifica en Supabase SQL Editor:

```sql
-- Debe retornar 1 fila con tu tienda
SELECT 
  u.email,
  t.nombre as tienda,
  ut.rol
FROM usuarios u
JOIN usuarios_tiendas ut ON ut.usuario_id = u.id
JOIN tiendas t ON t.id = ut.tienda_id
WHERE u.email = 'vegasebastian073@gmail.com';
```

Si retorna 0 filas, ejecuta también:
```sql
-- Crear la asociación
INSERT INTO usuarios_tiendas (usuario_id, tienda_id, rol, activo)
VALUES (
  'dd372437-8cf1-43b0-aa80-fc316caf6908',
  '809d8e08-f21e-419e-817d-e232826918f1',
  'admin_general',
  true
)
ON CONFLICT DO NOTHING;
```

## 📚 Más Info

- `SOLUCION_RLS.md` - Explicación detallada
- `INSTRUCCIONES_PRUEBA.md` - Guía completa de testing
