# Assets

Esta carpeta contiene los recursos visuales de la aplicación.

## Archivos Requeridos

Para que la app funcione correctamente, necesitas agregar:

1. **icon.png** (1024x1024px)
   - Icono principal de la app
   - Formato: PNG con transparencia
   - Tamaño: 1024x1024 píxeles

2. **splash.png** (1284x2778px para iOS, 1080x1920px para Android)
   - Pantalla de carga
   - Formato: PNG
   - Fondo blanco recomendado

3. **adaptive-icon.png** (1024x1024px)
   - Icono adaptativo para Android
   - Formato: PNG con transparencia
   - Solo el foreground, sin fondo

4. **favicon.png** (48x48px)
   - Favicon para web
   - Formato: PNG

## Cómo Crear los Assets

### Opción 1: Usar Herramientas Online
- [App Icon Generator](https://www.appicon.co/)
- [Figma](https://www.figma.com/)
- [Canva](https://www.canva.com/)

### Opción 2: Usar Expo Asset Generator
```bash
npx expo-asset-generator
```

### Opción 3: Crear Manualmente
1. Crea un icono de 1024x1024px con tu logo
2. Usa el mismo para icon.png y adaptive-icon.png
3. Crea un splash.png con tu logo centrado en fondo blanco
4. Redimensiona el icono a 48x48px para favicon.png

## Temporalmente

Por ahora, la app funcionará sin estos assets, pero verás advertencias.
Los assets se cargarán cuando los agregues a esta carpeta.
