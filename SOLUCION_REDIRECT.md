# 🔧 SOLUCIÓN: Redirect a Onboarding en vez de Dashboard

## 🐛 Problema

El usuario `vegasebastian073@gmail.com` tiene una tienda asociada en la base de datos, pero al hacer login era redirigido al onboarding (creación de tienda) en vez del dashboard.

## 🔍 Causa Raíz

1. **Timing Issue**: El componente `index.tsx` verificaba `tiendas.length === 0` antes de que el estado se actualizara completamente
2. **Consulta Incompleta**: El AuthContext solo traía los IDs de las tiendas, no los datos completos
3. **Sin Delay**: No había tiempo para que React actualizara el estado antes de hacer el redirect

## ✅ Solución Implementada

### 1. Mejorar la Consulta de Tiendas (AuthContext.tsx)

**Antes:**
```typescript
const { data: tiendasData } = await supabase
    .from('usuarios_tiendas')
    .select('*')
    .eq('usuario_id', userId)
    .eq('activo', true);
```

**Después:**
```typescript
const { data: tiendasData } = await supabase
    .from('usuarios_tiendas')
    .select(`
        *,
        tiendas:tienda_id (
            id,
            nombre,
            slug,
            direccion,
            telefono,
            activa
        )
    `)
    .eq('usuario_id', userId)
    .eq('activo', true);
```

### 2. Agregar Estado de "Ready" (index.tsx)

**Antes:**
```typescript
if (loading) {
    return <ActivityIndicator />;
}

if (tiendas.length === 0) {
    return <Redirect href="/onboarding" />;
}
```

**Después:**
```typescript
const [isReady, setIsReady] = useState(false);

useEffect(() => {
    if (!loading) {
        const timer = setTimeout(() => {
            console.log('🔍 Estado final:', {
                session: !!session,
                usuario: !!usuario,
                tiendas: tiendas.length,
                loading
            });
            setIsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }
}, [loading, session, usuario, tiendas]);

if (loading || !isReady) {
    return <ActivityIndicator />;
}
```

### 3. Agregar Logs de Debugging

Ahora la consola muestra:
- 🔄 Cuando empieza a cargar datos
- ✅ Cuando se cargan correctamente
- ❌ Si hay errores
- 📊 Cantidad de tiendas encontradas
- ➡️ A dónde se está redirigiendo

### 4. Script SQL de Verificación

Creado `fix_usuario_sebastian.sql` para asegurar que:
- El usuario existe en la tabla `usuarios`
- La asociación en `usuarios_tiendas` está activa
- La tienda está activa

## 📊 Flujo Correcto

```
1. Usuario hace login
   ↓
2. AuthContext.signIn() → Supabase Auth
   ↓
3. onAuthStateChange detecta cambio
   ↓
4. loadUserData(userId) se ejecuta
   ↓
5. Consulta usuarios → setUsuario()
   ↓
6. Consulta usuarios_tiendas → setTiendas()
   ↓
7. setLoading(false)
   ↓
8. index.tsx espera 100ms
   ↓
9. setIsReady(true)
   ↓
10. Verifica tiendas.length
    ↓
11. tiendas.length > 0 → Redirect a /(tabs)
```

## 🧪 Cómo Probar

1. Ejecutar `fix_usuario_sebastian.sql` en Supabase
2. Iniciar app: `npm start`
3. Login con: `vegasebastian073@gmail.com` / `sebas12345`
4. Verificar logs en consola
5. Debe ir directo al Dashboard

## 📁 Archivos Modificados

- ✏️ `tienda-multi/contexts/AuthContext.tsx`
- ✏️ `tienda-multi/app/index.tsx`
- ➕ `tienda-multi/supabase/fix_usuario_sebastian.sql`
- ➕ `tienda-multi/supabase/verificar_usuario.sql`
- ➕ `tienda-multi/INSTRUCCIONES_PRUEBA.md`

## 🎯 Resultado

✅ Usuario con tienda → Dashboard
✅ Usuario sin tienda → Onboarding
✅ Sin sesión → Login
✅ Logs claros para debugging
