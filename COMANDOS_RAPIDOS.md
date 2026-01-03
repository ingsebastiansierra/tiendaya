# ⚡ Comandos Rápidos - TiendaMulti

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar la aplicación
npm start

# Iniciar en Android
npm run android

# Iniciar en iOS
npm run ios

# Iniciar en Web
npm run web

# Limpiar caché y reiniciar
npm start -- --clear
```

## 📱 Atajos en Expo

Cuando ejecutas `npm start`, puedes usar:

- `a` - Abrir en Android
- `i` - Abrir en iOS
- `w` - Abrir en Web
- `r` - Recargar app
- `m` - Abrir menú de desarrollo
- `j` - Abrir debugger
- `c` - Limpiar caché

## 🔧 Desarrollo

```bash
# Ver estructura del proyecto
tree -I 'node_modules|.git'

# Buscar en archivos
grep -r "texto" app/

# Ver logs en tiempo real
npx expo start --dev-client
```

## 📦 Gestión de Dependencias

```bash
# Agregar nueva dependencia
npm install nombre-paquete

# Actualizar dependencias
npm update

# Ver dependencias desactualizadas
npm outdated

# Reinstalar todo
rm -rf node_modules package-lock.json
npm install
```

## 🗄️ Supabase

```bash
# Ejecutar schema en Supabase SQL Editor
# Copiar contenido de: supabase/schema.sql

# Verificar instalación
# Ejecutar: supabase/verificacion.sql

# Insertar datos de prueba
# Ejecutar: supabase/datos_prueba.sql
```

## 🐛 Debugging

```bash
# Ver logs detallados
npx expo start --dev-client --clear

# Inspeccionar con React DevTools
npm install -g react-devtools
react-devtools

# Ver errores de TypeScript
npx tsc --noEmit
```

## 📱 Testing en Dispositivo Real

### Android
```bash
# Conectar dispositivo por USB
adb devices

# Instalar en dispositivo
npm run android
```

### iOS
```bash
# Requiere Mac y Xcode
npm run ios
```

### Expo Go (Más fácil)
1. Instalar Expo Go desde Play Store / App Store
2. Ejecutar `npm start`
3. Escanear QR con Expo Go

## 🔐 Variables de Entorno

```bash
# Ver variables actuales
cat .env

# Editar variables
nano .env
# o
code .env
```

## 📊 Análisis de Código

```bash
# Verificar sintaxis TypeScript
npx tsc --noEmit

# Formatear código (si tienes Prettier)
npx prettier --write "**/*.{ts,tsx,js,jsx,json}"

# Linter (si tienes ESLint)
npx eslint "**/*.{ts,tsx,js,jsx}"
```

## 🚀 Build para Producción

```bash
# Build para Android (APK)
eas build --platform android

# Build para iOS
eas build --platform ios

# Build para ambos
eas build --platform all
```

## 📱 Expo Go vs Development Build

### Expo Go (Recomendado para desarrollo)
```bash
npm start
# Escanear QR con Expo Go
```

### Development Build (Para funciones nativas)
```bash
# Crear build de desarrollo
eas build --profile development --platform android
eas build --profile development --platform ios

# Instalar en dispositivo
# Luego ejecutar:
npx expo start --dev-client
```

## 🔄 Git (Control de Versiones)

```bash
# Inicializar repositorio
git init

# Agregar archivos
git add .

# Commit
git commit -m "Initial commit"

# Conectar con GitHub
git remote add origin https://github.com/tu-usuario/tienda-multi.git
git push -u origin main
```

## 📝 Notas Importantes

### Archivos a NO subir a Git
- `.env` (contiene credenciales)
- `node_modules/`
- `.expo/`
- `dist/`

### Archivos a SÍ subir
- `.env.example` (sin credenciales)
- Todo el código fuente
- Documentación

## 🆘 Solución Rápida de Problemas

### Error: "Metro bundler failed"
```bash
npm start -- --clear
```

### Error: "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### Error: "Port already in use"
```bash
# Cambiar puerto
npm start -- --port 8082
```

### App no actualiza cambios
```bash
# Presiona 'r' en la terminal de Expo
# O sacude el dispositivo y selecciona "Reload"
```

### Error de TypeScript
```bash
# Verificar errores
npx tsc --noEmit

# Reiniciar TypeScript server en VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

## 📚 Recursos Útiles

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

## 🎯 Workflow Recomendado

1. **Desarrollo**
   ```bash
   npm start
   ```

2. **Hacer cambios en código**
   - Guardar archivo
   - App se recarga automáticamente

3. **Probar en dispositivo**
   - Usar Expo Go para pruebas rápidas
   - Usar emulador para pruebas más completas

4. **Commit cambios**
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push
   ```

---

**¡Listo para desarrollar! 🚀**

Ejecuta `npm start` y comienza a codear.
