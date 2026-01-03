# 📱 Guía de Instalación - TiendaMulti

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
cd tienda-multi

# Instalación limpia (recomendado)
rm -rf node_modules package-lock.json
npm install

# O instalación normal
npm install
```

### 2. Configurar Variables de Entorno

El archivo `.env` ya está configurado con tus credenciales de Supabase:
```
EXPO_PUBLIC_SUPABASE_URL=https://camlbsxrmbkuagwwsetg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
```

### 3. Iniciar la Aplicación

```bash
# Limpiar caché e iniciar
npm start -- --clear

# O iniciar normal
npm start
```

**IMPORTANTE**: Asegúrate de tener **Expo Go SDK 54** instalado en tu dispositivo.
- Android: Actualiza desde Google Play Store
- iOS: Actualiza desde App Store

Luego presiona:
- `a` para Android
- `i` para iOS
- `w` para Web

## 📋 Flujo de la Aplicación

### 1. Registro de Usuario

1. Abre la app
2. Click en "Regístrate"
3. Completa el formulario:
   - Nombre completo
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Confirmar contraseña
4. Click en "Crear Cuenta"

### 2. Crear Primera Tienda (Onboarding)

Después de registrarte, serás guiado por 3 pasos:

#### **Paso 1: Información Básica**
- Nombre de la tienda (obligatorio)
- Dirección
- Teléfono
- Email

#### **Paso 2: Categorías de Productos**
Selecciona las categorías que vendes:
- 📝 Papelería
- 🍺 Cervezas
- 🥤 Bebidas
- 🍔 Onces
- 🍿 Snacks
- 🍬 Dulces
- 🧹 Aseo
- 🚬 Cigarrillos
- 🍎 Frutas
- 🥬 Verduras
- 🥛 Lácteos
- 🍞 Panadería

#### **Paso 3: Configuración Inicial**
- Efectivo inicial en caja (ej: $50,000)

### 3. Dashboard

Una vez creada la tienda, verás:
- **Estadísticas**: Ventas del día, productos, stock bajo, clientes
- **Acciones Rápidas**:
  - Agregar Producto
  - Nueva Venta
  - Ver Reportes

## 🎯 Funcionalidades Implementadas

### ✅ Autenticación
- Registro de usuarios
- Inicio de sesión
- Cierre de sesión
- Persistencia de sesión

### ✅ Onboarding
- Flujo guiado de 3 pasos
- Creación de tienda
- Configuración de categorías
- Asignación automática de rol admin_general

### ✅ Dashboard
- Vista general de la tienda
- Estadísticas básicas
- Acciones rápidas

### ✅ Perfil
- Ver información del usuario
- Cerrar sesión

## 🔧 Estructura del Proyecto

```
tienda-multi/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx          # Pantalla de inicio de sesión
│   │   └── register.tsx       # Pantalla de registro
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard
│   │   ├── ventas.tsx         # Ventas (próximamente)
│   │   ├── inventario.tsx     # Inventario (próximamente)
│   │   └── perfil.tsx         # Perfil de usuario
│   ├── onboarding/
│   │   ├── index.tsx          # Bienvenida
│   │   ├── step1.tsx          # Información básica
│   │   ├── step2.tsx          # Categorías
│   │   ├── step3.tsx          # Configuración
│   │   └── success.tsx        # Éxito
│   ├── _layout.tsx            # Layout principal
│   └── index.tsx              # Punto de entrada
├── contexts/
│   └── AuthContext.tsx        # Contexto de autenticación
├── lib/
│   └── supabase.ts            # Cliente de Supabase
├── types/
│   └── database.ts            # Tipos de TypeScript
└── docs/                      # Documentación

```

## 🎨 Paleta de Colores

- **Verde Principal**: #10B981 (Botones, acciones positivas)
- **Gris Oscuro**: #1F2937 (Textos principales)
- **Gris Medio**: #6B7280 (Textos secundarios)
- **Gris Claro**: #F9FAFB (Fondos)
- **Rojo**: #DC2626 (Acciones destructivas)

## 📱 Tipos de Pago Disponibles

La base de datos ya tiene configurados 6 tipos de pago:

1. **Efectivo** 💵 - Verde
2. **Daviplata** 📱 - Rojo (requiere referencia)
3. **Nequi** 📱 - Rosa (requiere referencia)
4. **Fiado** 💳 - Naranja (sistema de crédito)
5. **Transferencia** 🏦 - Azul (requiere referencia)
6. **Tarjeta** 💳 - Morado (requiere referencia)

## 🔐 Roles Disponibles

- **admin_general**: Control total (asignado automáticamente al crear tienda)
- **dueño_local**: Visualización y reportes
- **admin_local**: Gestión operativa
- **admin_asistente**: Operaciones básicas

## 🐛 Solución de Problemas

### Error: "No se pudo crear la tienda"
- Verifica que el schema de Supabase esté ejecutado
- Revisa las credenciales en `.env`
- Verifica que RLS esté configurado correctamente

### Error: "No se pudo iniciar sesión"
- Verifica que el email y contraseña sean correctos
- Asegúrate de haber confirmado el email (si está habilitado)

### La app no carga
```bash
# Limpiar caché
npm start -- --clear

# O reinstalar dependencias
rm -rf node_modules
npm install
```

## 📚 Próximas Funcionalidades

### Fase 1 - Inventario (Próxima)
- [ ] Agregar productos
- [ ] Editar productos
- [ ] Ver lista de productos
- [ ] Alertas de stock bajo

### Fase 2 - Ventas
- [ ] Punto de venta
- [ ] Selección de tipo de pago
- [ ] Ventas en efectivo
- [ ] Ventas con Daviplata/Nequi
- [ ] Ventas fiadas

### Fase 3 - Clientes y Fiados
- [ ] Gestión de clientes
- [ ] Límites de crédito
- [ ] Registro de abonos
- [ ] Consulta de cartera

### Fase 4 - Reportes
- [ ] Ventas por tipo de pago
- [ ] Cuadre de caja
- [ ] Productos más vendidos
- [ ] Estado de cartera

## 🆘 Soporte

Para ayuda adicional:
1. Revisa la documentación en `/docs`
2. Consulta los queries de ejemplo en `/supabase/queries`
3. Verifica el estado del proyecto en `ESTADO_PROYECTO.md`

---

**¡Listo para comenzar! 🎉**

Ejecuta `npm start` y comienza a usar tu aplicación.
