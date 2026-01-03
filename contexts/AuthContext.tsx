import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Usuario, UsuarioTienda } from '@/types/database';

type AuthContextType = {
    session: Session | null;
    user: User | null;
    usuario: Usuario | null;
    tiendas: UsuarioTienda[];
    tiendaActual: UsuarioTienda | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, nombreCompleto: string) => Promise<void>;
    signOut: () => Promise<void>;
    setTiendaActual: (tienda: UsuarioTienda) => void;
    refreshTiendas: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [tiendas, setTiendas] = useState<UsuarioTienda[]>([]);
    const [tiendaActual, setTiendaActual] = useState<UsuarioTienda | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user.id);
            } else {
                setUsuario(null);
                setTiendas([]);
                setTiendaActual(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserData = async (userId: string) => {
        try {
            console.log('🔄 Cargando datos del usuario:', userId);

            // Cargar datos del usuario
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError) {
                console.error('❌ Error cargando usuario:', userError);
                throw userError;
            }

            console.log('✅ Usuario cargado:', userData);
            setUsuario(userData);

            // Cargar tiendas del usuario
            console.log('🔍 Consultando tiendas para usuario:', userId);
            const { data: tiendasData, error: tiendasError } = await supabase
                .from('usuarios_tiendas')
                .select(`
                    *,
                    tiendas:tienda_id (
                        id,
                        nombre,
                        slug,
                        direccion,
                        telefono,
                        activa
                    )
                `)
                .eq('usuario_id', userId)
                .eq('activo', true);

            if (tiendasError) {
                console.error('❌ Error cargando tiendas:', tiendasError);
                console.error('❌ Error details:', JSON.stringify(tiendasError, null, 2));
                throw tiendasError;
            }

            console.log('✅ Tiendas cargadas (raw):', JSON.stringify(tiendasData, null, 2));
            console.log('📊 Tipo de tiendasData:', typeof tiendasData);
            console.log('📊 Es array:', Array.isArray(tiendasData));
            console.log('📊 Cantidad de tiendas:', tiendasData?.length || 0);

            if (!tiendasData || tiendasData.length === 0) {
                console.warn('⚠️ No se encontraron tiendas para el usuario');
                console.warn('⚠️ Verifica en Supabase que el usuario tenga asociaciones en usuarios_tiendas');
            }

            setTiendas(tiendasData || []);
            console.log('✅ Estado tiendas actualizado');

            // Seleccionar primera tienda por defecto
            if (tiendasData && tiendasData.length > 0) {
                console.log('✅ Seleccionando tienda:', tiendasData[0]);
                setTiendaActual(tiendasData[0]);
            } else {
                console.log('⚠️ No hay tiendas para este usuario');
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
        } finally {
            setLoading(false);
            console.log('✅ Loading completado');
        }
    };

    const refreshTiendas = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('usuarios_tiendas')
            .select(`
                *,
                tiendas:tienda_id (
                    id,
                    nombre,
                    slug,
                    direccion,
                    telefono,
                    activa
                )
            `)
            .eq('usuario_id', user.id)
            .eq('activo', true);

        if (!error && data) {
            console.log('🔄 Tiendas actualizadas:', data);
            setTiendas(data);
            if (data.length > 0 && !tiendaActual) {
                setTiendaActual(data[0]);
            }
        }
    };

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string, nombreCompleto: string) => {
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No se pudo crear el usuario');

        // 2. Crear perfil en tabla usuarios
        const { error: profileError } = await supabase
            .from('usuarios')
            .insert({
                id: authData.user.id,
                email,
                nombre_completo: nombreCompleto,
                activo: true,
            });

        if (profileError) throw profileError;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                usuario,
                tiendas,
                tiendaActual,
                loading,
                signIn,
                signUp,
                signOut,
                setTiendaActual,
                refreshTiendas,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
