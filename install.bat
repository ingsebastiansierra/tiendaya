@echo off
echo 🚀 Instalando TiendaMulti...
echo.

REM Limpiar instalación anterior
echo 🧹 Limpiando instalación anterior...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .expo rmdir /s /q .expo

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm install

REM Verificar instalación
echo.
echo ✅ Instalación completada!
echo.
echo 📱 Próximos pasos:
echo 1. Asegúrate de tener Expo Go SDK 54 en tu dispositivo
echo 2. Ejecuta: npm start
echo 3. Escanea el QR con Expo Go
echo.
echo 🎉 ¡Listo para comenzar!
pause
