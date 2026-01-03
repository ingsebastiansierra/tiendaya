# 🏪 Plataforma Multi-Tienda con Expo + Supabase

Sistema completo de gestión para tiendas con soporte para múltiples métodos de pago incluyendo **Efectivo, Daviplata, Nequi y Fiado**.

## 🚀 Características Principales

### ✅ Multi-Tienda (Multi-Tenant)
- Una sola aplicación para múltiples tiendas
- Aislamiento completo de datos por tienda
- Escalable desde pequeños negocios hasta cadenas

### 💳 Sistema de Tipos de Pago
- **Efectivo** - Pago tradicional en efectivo
- **Daviplata** - Billetera digital (requiere número de transacción)
- **Nequi** - Billetera digital (requiere número de transacción)
- **Fiado** - Sistema completo de crédito con:
  - Límites de crédito por cliente
  - Abonos parciales
  - Alertas automáticas
  - Control de cartera
- **Transferencia** - Transferencias bancarias
- **Tarjeta** - Pagos con tarjeta débito/crédito

### 📦 Gestión de Inventario
- Control de stock en tiempo real
- Alertas automáticas de stock bajo
- Topes mínimos y máximos configurables
- Historial completo de movimientos
- Sugerencias automáticas de pedidos

### 👥 Sistema de Roles y Permisos
- **admin_general** - Control total del sistema
- **dueño_local** - Visualización y reportes
- **admin_local** - Gestión operativa
- **admin_asistente** - Operaciones básicas

### 🔐 Seguridad y Antifraude
- Row Level Security (RLS) en todas las tablas
- Auditoría completa de operaciones
- Logs de cambios críticos
- Alertas de movimientos sospechosos

## 📁 Estructura del Proyecto

```
tienda-multi/
├── docs/
│   ├── SETUP_SUPABASE.md          # Guía de configuración paso a paso
│   ├── TIPOS_PAGO.md              # Documentación completa de tipos de pago
│   └── RESUMEN_TIPOS_PAGO.md      # Resumen de implementación
├── supabase/
│   ├── schema.sql                 # Esquema completo de base de datos
│   └── queries/
│       └── tipos_pago_queries.sql # Queries útiles para reportes
└── README.md                      # Este archivo
```

## 🛠️ Stack Tecnológico

- **Frontend**: Expo (React Native)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Validación**: Zod
- **Estado**: TanStack Query / Zustand
- **Despliegue**: Android, iOS, Web (PWA), Desktop

## 📋 Requisitos Previos

- Node.js 18+
- Cuenta en Supabase
- Expo CLI

## 🚀 Inicio Rápido

### 1. Configurar Supabase

Sigue la guía completa en [docs/SETUP_SUPABASE.md](./docs/SETUP_SUPABASE.md)

Pasos básicos:
1. Crear proyecto en Supabase
2. Ejecutar `supabase/schema.sql` en SQL Editor
3. Copiar credenciales a `.env`

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 4. Iniciar Aplicación

```bash
npm start
```

## 📊 Base de Datos

### Tablas Principales

1. **tiendas** - Información de cada tienda
2. **usuarios** - Usuarios del sistema
3. **usuarios_tiendas** - Relación usuarios-tiendas con roles
4. **tipos_pago** - Métodos de pago disponibles
5. **clientes** - Clientes para ventas fiadas
6. **productos** - Catálogo de productos
7. **ventas** - Registro de ventas
8. **pagos_fiados** - Abonos a ventas a crédito
9. **sesiones** - Turnos/cajas
10. **gastos** - Registro de gastos
11. **pedidos** - Pedidos a proveedores
12. **alertas** - Notificaciones del sistema
13. **movimientos_inventario** - Auditoría de stock

### Triggers Automáticos

- ✅ Actualización de stock al vender
- ✅ Alertas de stock bajo/agotado
- ✅ Actualización de saldo de clientes (fiados)
- ✅ Verificación de límites de crédito
- ✅ Marcado automático de ventas pagadas

## 💡 Casos de Uso

### Venta en Efectivo
```typescript
await supabase.from('ventas').insert({
  tienda_id, sesion_id, usuario_id,
  numero_venta: 'V-001',
  total: 5000,
  tipo_pago_id: tipoPagoEfectivoId,
  pagada: true
});
```

### Venta con Daviplata/Nequi
```typescript
await supabase.from('ventas').insert({
  tienda_id, sesion_id, usuario_id,
  numero_venta: 'V-002',
  total: 10000,
  tipo_pago_id: tipoPagoDaviplataId,
  referencia_pago: '123456789', // Número de transacción
  pagada: true
});
```

### Venta Fiada
```typescript
// 1. Verificar límite
const { data: puede } = await supabase.rpc('puede_comprar_fiado', {
  p_cliente_id: clienteId,
  p_monto: 50000
});

// 2. Crear venta
await supabase.from('ventas').insert({
  tienda_id, sesion_id, usuario_id, cliente_id,
  numero_venta: 'V-003',
  total: 50000,
  tipo_pago_id: tipoPagoFiadoId,
  pagada: false
});
// El trigger actualiza automáticamente el saldo del cliente
```

### Registrar Abono
```typescript
await supabase.from('pagos_fiados').insert({
  tienda_id, venta_id, cliente_id, usuario_id,
  monto: 20000,
  tipo_pago_id: tipoPagoEfectivoId
});
// El trigger reduce el saldo y verifica si quedó pagada
```

## 📈 Reportes Disponibles

Ver queries completos en [supabase/queries/tipos_pago_queries.sql](./supabase/queries/tipos_pago_queries.sql)

- Ventas por tipo de pago (día/mes/rango)
- Clientes con deuda
- Deudas vencidas
- Cuadre de caja por tipo de pago
- Efectivo esperado vs real
- Tasa de recuperación de cartera
- Top clientes con mayor deuda

## 🔒 Seguridad

- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas por rol y tienda
- ✅ Auditoría completa de operaciones
- ✅ Validación en cliente y servidor
- ✅ Protección contra SQL injection
- ✅ Tokens JWT para autenticación

## 📱 Plataformas Soportadas

- ✅ Android
- ✅ iOS
- ✅ Web (PWA)
- ✅ Desktop (Electron)

## 📚 Documentación

- [Configuración de Supabase](./docs/SETUP_SUPABASE.md)
- [Sistema de Tipos de Pago](./docs/TIPOS_PAGO.md)
- [Resumen de Implementación](./docs/RESUMEN_TIPOS_PAGO.md)

## 🤝 Contribuir

Este es un proyecto de arquitectura base. Puedes:
1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

MIT

## 🆘 Soporte

Para preguntas o problemas:
1. Revisa la documentación en `/docs`
2. Verifica los logs en Supabase Dashboard
3. Consulta los queries de ejemplo

---

**Última actualización**: Enero 2026

Desarrollado con ❤️ para tiendas colombianas
