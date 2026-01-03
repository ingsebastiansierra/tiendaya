# 👨‍💻 Guía de Desarrollo - Tienda Multi

## 1. CONFIGURACIÓN DEL ENTORNO

### 1.1 Requisitos Previos

```bash
# Node.js 18+
node --version

# npm o yarn
npm --version

# Expo CLI
npm install -g expo-cli

# EAS CLI (para builds)
npm install -g eas-cli
```

### 1.2 Instalación Inicial

```bash
# Clonar repositorio
git clone <repo-url>
cd tienda-multi

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 1.3 Configurar Supabase

1. Crear proyecto en https://supabase.com
2. Ir a SQL Editor
3. Ejecutar `supabase/schema.sql`
4. Copiar URL y Anon Key a `.env`

## 2. ESTRUCTURA DEL PROYECTO

```
tienda-multi/
├── app/                    # Pantallas (Expo Router)
│   ├── (auth)/            # Flujo de autenticación
│   ├── (tabs)/            # Navegación principal
│   └── _layout.tsx        # Layout raíz
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── store/            # Estado global (Zustand)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Configuraciones
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Utilidades
│   └── constants/        # Constantes
├── supabase/
│   ├── schema.sql        # Esquema de BD
│   ├── migrations/       # Migraciones
│   └── functions/        # Edge Functions
├── docs/                 # Documentación
└── assets/              # Imágenes, fuentes, etc.
```

## 3. CONVENCIONES DE CÓDIGO

### 3.1 TypeScript

```typescript
// ✅ BIEN: Tipos explícitos
interface Producto {
  id: string;
  nombre: string;
  precio: number;
}

const producto: Producto = {
  id: '123',
  nombre: 'Coca Cola',
  precio: 2500,
};

// ❌ MAL: Tipos implícitos
const producto = {
  id: '123',
  nombre: 'Coca Cola',
  precio: 2500,
};
```

### 3.2 Nombres de Archivos

```
// Componentes: PascalCase
ProductCard.tsx
InventoryList.tsx

// Hooks: camelCase con prefijo 'use'
useProducts.ts
useAuth.ts

// Stores: camelCase con sufijo 'Store'
authStore.ts
inventarioStore.ts

// Utilidades: camelCase
formatCurrency.ts
validateEmail.ts
```

### 3.3 Componentes

```typescript
// ✅ BIEN: Componente funcional con tipos
import { View, Text, StyleSheet } from 'react-native';

interface ProductCardProps {
  nombre: string;
  precio: number;
  stock: number;
  onPress?: () => void;
}

export default function ProductCard({ 
  nombre, 
  precio, 
  stock,
  onPress 
}: ProductCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.nombre}>{nombre}</Text>
      <Text style={styles.precio}>${precio.toLocaleString()}</Text>
      <Text style={styles.stock}>Stock: {stock}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  precio: {
    fontSize: 14,
    color: '#27ae60',
  },
  stock: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});
```

### 3.4 Stores (Zustand)

```typescript
import { create } from 'zustand';

interface ProductoState {
  productos: Producto[];
  loading: boolean;
  error: string | null;
  
  // Acciones
  fetchProductos: (tiendaId: string) => Promise<void>;
  addProducto: (producto: Producto) => void;
  updateProducto: (id: string, data: Partial<Producto>) => void;
  deleteProducto: (id: string) => void;
}

export const useProductoStore = create<ProductoState>((set, get) => ({
  productos: [],
  loading: false,
  error: null,

  fetchProductos: async (tiendaId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('tienda_id', tiendaId);

      if (error) throw error;
      set({ productos: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  addProducto: (producto) => {
    set((state) => ({
      productos: [...state.productos, producto],
    }));
  },

  updateProducto: (id, data) => {
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));
  },

  deleteProducto: (id) => {
    set((state) => ({
      productos: state.productos.filter((p) => p.id !== id),
    }));
  },
}));
```

## 4. PATRONES Y MEJORES PRÁCTICAS

### 4.1 Manejo de Errores

```typescript
// ✅ BIEN: Try-catch con feedback al usuario
const handleSubmit = async () => {
  try {
    setLoading(true);
    await supabase.from('productos').insert(data);
    Alert.alert('Éxito', 'Producto creado correctamente');
    navigation.goBack();
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Ocurrió un error');
  } finally {
    setLoading(false);
  }
};

// ❌ MAL: Sin manejo de errores
const handleSubmit = async () => {
  await supabase.from('productos').insert(data);
  navigation.goBack();
};
```

### 4.2 Validación con Zod

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const productoSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres'),
  precio_venta: z.number().positive('Debe ser mayor a 0'),
  stock_minimo: z.number().min(0, 'No puede ser negativo'),
  stock_maximo: z.number().min(0, 'No puede ser negativo'),
}).refine(data => data.stock_maximo >= data.stock_minimo, {
  message: 'Stock máximo debe ser mayor o igual al mínimo',
  path: ['stock_maximo'],
});

type ProductoForm = z.infer<typeof productoSchema>;

export default function ProductoForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<ProductoForm>({
    resolver: zodResolver(productoSchema),
  });

  const onSubmit = (data: ProductoForm) => {
    // data está validado y tipado
    console.log(data);
  };

  return (
    // Formulario...
  );
}
```

### 4.3 Custom Hooks

```typescript
// hooks/useProductos.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Producto } from '../types/database.types';

export function useProductos(tiendaId: string) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, [tiendaId]);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('tienda_id', tiendaId);

      if (error) throw error;
      setProductos(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchProductos();

  return { productos, loading, error, refetch };
}

// Uso en componente
function InventarioScreen() {
  const tiendaId = useAuthStore((state) => state.tiendaActual);
  const { productos, loading, error, refetch } = useProductos(tiendaId!);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <ProductList productos={productos} onRefresh={refetch} />;
}
```

### 4.4 Realtime Subscriptions

```typescript
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeProductos(tiendaId: string) {
  const updateProducto = useProductoStore((state) => state.updateProducto);

  useEffect(() => {
    const channel = supabase
      .channel('productos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productos',
          filter: `tienda_id=eq.${tiendaId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            updateProducto(payload.new.id, payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tiendaId]);
}
```

## 5. TESTING

### 5.1 Unit Tests

```typescript
// __tests__/utils/formatCurrency.test.ts
import { formatCurrency } from '../../src/utils/formatCurrency';

describe('formatCurrency', () => {
  it('formatea números correctamente', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(1500.50)).toBe('$1,500.50');
  });

  it('maneja valores negativos', () => {
    expect(formatCurrency(-500)).toBe('-$500');
  });

  it('maneja cero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});
```

### 5.2 Integration Tests

```typescript
// __tests__/stores/authStore.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuthStore } from '../../src/store/authStore';

describe('authStore', () => {
  it('inicia sesión correctamente', async () => {
    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(result.current.user).not.toBeNull();
  });
});
```

## 6. PERFORMANCE

### 6.1 Optimización de Renders

```typescript
// ✅ BIEN: Memoización
import { memo, useMemo, useCallback } from 'react';

const ProductCard = memo(({ producto }: { producto: Producto }) => {
  return (
    <View>
      <Text>{producto.nombre}</Text>
    </View>
  );
});

// ✅ BIEN: useMemo para cálculos costosos
const productosFiltrados = useMemo(() => {
  return productos.filter(p => 
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [productos, searchQuery]);

// ✅ BIEN: useCallback para funciones
const handlePress = useCallback((id: string) => {
  navigation.navigate('ProductDetail', { id });
}, [navigation]);
```

### 6.2 Lazy Loading

```typescript
// ✅ BIEN: Carga lazy de imágenes
import { Image } from 'expo-image';

<Image
  source={{ uri: producto.imagen_url }}
  placeholder={require('../assets/placeholder.png')}
  contentFit="cover"
  transition={200}
/>
```

### 6.3 Paginación

```typescript
const ITEMS_PER_PAGE = 20;

function useProductosPaginados(tiendaId: string) {
  const [page, setPage] = useState(0);
  const [productos, setProductos] = useState<Producto[]>([]);

  const fetchPage = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('tienda_id', tiendaId)
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

    setProductos(prev => [...prev, ...(data || [])]);
  };

  const loadMore = () => setPage(p => p + 1);

  return { productos, loadMore };
}
```

## 7. SEGURIDAD

### 7.1 Validación de Permisos

```typescript
// utils/permissions.ts
export function canEditProduct(rol: RolTipo): boolean {
  return ['admin_general', 'admin_local'].includes(rol);
}

export function canDeleteProduct(rol: RolTipo): boolean {
  return rol === 'admin_general';
}

export function canApproveExpense(rol: RolTipo): boolean {
  return ['admin_general', 'dueño_local'].includes(rol);
}

// Uso en componente
function ProductActions({ producto }: { producto: Producto }) {
  const rol = useAuthStore((state) => state.rolActual?.rol);

  return (
    <View>
      {canEditProduct(rol!) && (
        <Button title="Editar" onPress={handleEdit} />
      )}
      {canDeleteProduct(rol!) && (
        <Button title="Eliminar" onPress={handleDelete} />
      )}
    </View>
  );
}
```

### 7.2 Sanitización de Inputs

```typescript
// ✅ BIEN: Sanitizar antes de guardar
const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

const handleSubmit = async (data: ProductoForm) => {
  const sanitized = {
    ...data,
    nombre: sanitizeInput(data.nombre),
    descripcion: sanitizeInput(data.descripcion || ''),
  };

  await supabase.from('productos').insert(sanitized);
};
```

## 8. DEBUGGING

### 8.1 Logs Estructurados

```typescript
// utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },
};

// Uso
logger.info('Fetching productos', { tiendaId });
logger.error('Error al guardar producto', error);
```

### 8.2 React Native Debugger

```bash
# Instalar
brew install --cask react-native-debugger

# Usar
# Abrir React Native Debugger
# En la app: Cmd+D (iOS) o Cmd+M (Android)
# Seleccionar "Debug"
```

## 9. DEPLOYMENT

### 9.1 Build de Producción

```bash
# Configurar EAS
eas build:configure

# Build para Android
eas build --platform android --profile production

# Build para iOS
eas build --platform ios --profile production

# Build para ambos
eas build --platform all --profile production
```

### 9.2 Updates OTA

```bash
# Publicar update
eas update --branch production --message "Fix de bugs"

# Ver updates
eas update:list --branch production
```

## 10. RECURSOS

### 10.1 Documentación Oficial

- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Zustand Docs](https://docs.pmnd.rs/zustand)

### 10.2 Herramientas Útiles

- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [Reactotron](https://github.com/infinitered/reactotron)

---

**¿Preguntas?** Consulta la documentación o contacta al equipo de desarrollo.
