#!/bin/bash

echo "🚀 Instalando TiendaMulti..."
echo ""

# Limpiar instalación anterior
echo "🧹 Limpiando instalación anterior..."
rm -rf node_modules package-lock.json .expo

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Verificar instalación
echo ""
echo "✅ Instalación completada!"
echo ""
echo "📱 Próximos pasos:"
echo "1. Asegúrate de tener Expo Go SDK 54 en tu dispositivo"
echo "2. Ejecuta: npm start"
echo "3. Escanea el QR con Expo Go"
echo ""
echo "🎉 ¡Listo para comenzar!"
