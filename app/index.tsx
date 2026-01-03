import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function Index() {
    const { session, loading, tiendas, usuario } = useAuth();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Esperar a que termine de cargar completamente
        if (!loading) {
            // Pequeño delay para asegurar que el estado esté actualizado
            const timer = setTimeout(() => {
                console.log('🔍 Estado final:', {
                    session: !!session,
                    usuario: !!usuario,
                    tiendas: tiendas.length,
                    loading
                });
                setIsReady(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, session, usuario, tiendas]);

    // Mostrar loading mientras carga o no está listo
    if (loading || !isReady) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    // Si no hay sesión, ir a login
    if (!session) {
        console.log('➡️ Redirigiendo a login (no hay sesión)');
        return <Redirect href="/(auth)/login" />;
    }

    // Si hay sesión pero no tiene tiendas, ir a onboarding
    if (tiendas.length === 0) {
        console.log('➡️ Redirigiendo a onboarding (sin tiendas)');
        return <Redirect href="/onboarding" />;
    }

    // Si tiene sesión y tiendas, ir al dashboard
    console.log('➡️ Redirigiendo a dashboard (con tiendas)');
    return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
});
