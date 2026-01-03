# 🏪 TiendaYa - Sistema Multi-Tienda

Sistema de gestión multi-tienda desarrollado con Expo + React Native + Supabase.

## 🚀 Características

- 📱 **Multiplataforma**: Android, iOS, Web (PWA) y Escritorio
- 🏢 **Multi-Tienda**: Una app, múltiples tiendas independientes
- 🔐 **Roles y Permisos**: 4 niveles de acceso con RLS
- 💰 **6 Tipos de Pago**: Efectivo, Daviplata, Nequi, Fiado, Transferencia, Tarjeta
- 📦 **Inventario Inteligente**: Control de stock con alertas automáticas
- 👥 **Gestión de Clientes**: Sistema de crédito (fiado) con límites
- 📊 **Dashboard en Tiempo Real**: Métricas y reportes

## 🛠️ Stack Tecnológico

- **Frontend**: Expo SDK 54 + React Native
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Realtime)
- **Navegación**: Expo Router
- **Validación**: Zod
- **Estilos**: React Native StyleSheet

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Expo Go (para testing en móvil)
- Cuenta de Supabase

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/ingsebastiansierra/tiendaya.git
cd tiendaya/tienda-multi
```

### 2. Instalar dependencias

```bash
npm install --legacy-peer-deps
```

O usa el script de instalación:

**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia `.env.example` a `.env`
3. Agrega tus credenciales de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

4. Ejecuta el schema en Supabase SQL Editor:

```bash
# Ejecutar en orden:
1. supabase/schema.sql
2. supabase/fix_rls_policies.sql (IMPORTANTE)
3. supabase/datos_prueba.sql (opcional)
```

Ver guía completa: [docs/SETUP_SUPABASE.md](docs/SETUP_SUPABASE.md)

### 4. Iniciar la app

```bash
npm start
```

Escanea el QR con Expo Go o presiona:
- `a` para Android
- `i` para iOS
- `w` para Web

## 👤 Usuario de Prueba

Si ejecutaste `datos_prueba.sql`:

```
Email: vegasebastian073@gmail.com
Password: sebas12345
Rol: admin_general
```

## 📁 Estructura del Proyecto

```
tienda-multi/
├── app/                    # Pantallas (Expo Router)
│   ├── (auth)/            # Login, Register
│   ├── (tabs)/            # Dashboard, Ventas, Inventario, Perfil
│   ├── onboarding/        # Flujo de creación de tienda
│   └── index.tsx          # Punto de entrada
├── contexts/              # Context API (Auth)
├── lib/                   # Configuración (Supabase)
├── types/                 # TypeScript types
├── supabase/              # Scripts SQL
│   ├── schema.sql         # Schema completo
│   ├── fix_rls_policies.sql  # Políticas RLS (CRÍTICO)
│   └── datos_prueba.sql   # Datos de ejemplo
└── docs/                  # Documentación
```

## 🔐 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **admin_general** | Control total del sistema |
| **dueño_local** | Ver métricas, solicitar cambios |
| **admin_local** | Gestionar inventario, gastos, productos |
| **admin_asistente** | Registrar ventas y gastos menores |

## 💳 Tipos de Pago

1. **Efectivo** - Pago inmediato en efectivo
2. **Daviplata** - Transferencia por Daviplata
3. **Nequi** - Transferencia por Nequi
4. **Fiado** - Sistema de crédito con límites
5. **Transferencia** - Transferencia bancaria
6. **Tarjeta** - Pago con tarjeta débito/crédito

## 📊 Base de Datos

18 tablas principales:
- `tiendas` - Información de tiendas
- `usuarios` - Perfiles de usuarios
- `usuarios_tiendas` - Asociación usuario-tienda
- `productos` - Catálogo de productos
- `categorias` - Categorías de productos
- `proveedores` - Proveedores
- `ventas` - Registro de ventas
- `tipos_pago` - Métodos de pago
- `clientes` - Clientes con crédito
- `pagos_fiados` - Pagos parciales de crédito
- Y más...

Ver schema completo: [supabase/schema.sql](supabase/schema.sql)

## 🐛 Solución de Problemas

### Error: Usuario redirige a onboarding

**Causa**: Faltan políticas RLS

**Solución**: Ejecuta `supabase/fix_rls_policies.sql` en Supabase

Ver: [SOLUCION_RLS.md](SOLUCION_RLS.md)

### Error: Cannot call a class as a function

**Causa**: Import faltante en componentes

**Solución**: Verifica que todos los componentes de React Native estén importados

### Error: Dependencias incompatibles

**Solución**: Usa `--legacy-peer-deps`

```bash
npm install --legacy-peer-deps
```

## 📚 Documentación

- [Guía de Instalación](GUIA_INSTALACION.md)
- [Inicio Rápido](INICIO_RAPIDO.md)
- [Setup Supabase](docs/SETUP_SUPABASE.md)
- [Arquitectura](docs/ARQUITECTURA.md)
- [Tipos de Pago](docs/TIPOS_PAGO.md)
- [Roadmap](docs/ROADMAP.md)

## 🚧 Estado del Proyecto

✅ **Completado:**
- Autenticación y registro
- Onboarding (creación de tienda)
- Dashboard básico
- Sistema de roles y permisos
- Base de datos completa
- Políticas RLS

🚧 **En Desarrollo:**
- Módulo de ventas
- Módulo de inventario
- Gestión de clientes
- Reportes y métricas

📋 **Pendiente:**
- Notificaciones push
- Modo offline
- Sincronización
- Exportar reportes

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y está en desarrollo.

## 👨‍💻 Autor

**Sebastian Sierra**
- GitHub: [@ingsebastiansierra](https://github.com/ingsebastiansierra)
- Email: vegasebastian073@gmail.com

## 🙏 Agradecimientos

- [Expo](https://expo.dev)
- [Supabase](https://supabase.com)
- [React Native](https://reactnative.dev)

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!
