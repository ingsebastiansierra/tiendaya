import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Usuario, UsuarioTienda } from '../types/database.types';

interface AuthState {
  user: User | null;
  usuario: Usuario | null;
  tiendaActual: string | null;
  rolActual: UsuarioTienda | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUsuario: (usuario: Usuario | null) => void;
  setTiendaActual: (tiendaId: string) => void;
  setRolActual: (rol: UsuarioTienda | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  usuario: null,
  tiendaActual: null,
  rolActual: null,
  loading: true,

  setUser: (user) => set({ user }),
  setUsuario: (usuario) => set({ usuario }),
  setTiendaActual: (tiendaId) => set({ tiendaActual: tiendaId }),
  setRolActual: (rol) => set({ rolActual: rol }),

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      set({ user: data.user });
      
      // Obtener datos del usuario
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (usuario) {
        set({ usuario });
      }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, usuario: null, tiendaActual: null, rolActual: null });
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });

        const { data: usuario } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (usuario) {
          set({ usuario });
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
