import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Producto } from '../types/database.types';

interface InventarioState {
  productos: Producto[];
  productosFaltantes: Producto[];
  loading: boolean;
  fetchProductos: (tiendaId: string) => Promise<void>;
  fetchProductosFaltantes: (tiendaId: string) => Promise<void>;
  actualizarStock: (productoId: string, cantidad: number) => Promise<void>;
}

export const useInventarioStore = create<InventarioState>((set, get) => ({
  productos: [],
  productosFaltantes: [],
  loading: false,

  fetchProductos: async (tiendaId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          categoria:categorias(*),
          proveedor:proveedores(*)
        `)
        .eq('tienda_id', tiendaId)
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      set({ productos: data || [] });
    } catch (error) {
      console.error('Error fetching productos:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchProductosFaltantes: async (tiendaId: string) => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('tienda_id', tiendaId)
        .lte('stock_actual', supabase.raw('stock_minimo'))
        .eq('activo', true)
        .order('stock_actual');

      if (error) throw error;
      set({ productosFaltantes: data || [] });
    } catch (error) {
      console.error('Error fetching productos faltantes:', error);
    }
  },

  actualizarStock: async (productoId: string, cantidad: number) => {
    try {
      const { error } = await supabase
        .from('productos')
        .update({ 
          stock_actual: cantidad,
          updated_at: new Date().toISOString()
        })
        .eq('id', productoId);

      if (error) throw error;

      // Actualizar localmente
      set((state) => ({
        productos: state.productos.map((p) =>
          p.id === productoId ? { ...p, stock_actual: cantidad } : p
        ),
      }));
    } catch (error) {
      console.error('Error actualizando stock:', error);
      throw error;
    }
  },
}));
