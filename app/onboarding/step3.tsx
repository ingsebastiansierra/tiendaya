import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingStep3() {
    const [efectivoInicial, setEfectivoInicial] = useState('50000');
    const [loading, setLoading] = useState(false);
    const { user, refreshTiendas } = useAuth();

    const handleFinish = async () => {
        if (!user) {
            Alert.alert('Error', 'No hay usuario autenticado');
            return;
        }

        setLoading(true);
        try {
            // 1. Obtener datos de los pasos anteriores
            const step1Data = await AsyncStorage.getItem('onboarding_step1');
            const step2Data = await AsyncStorage.getItem('onboarding_step2');

            if (!step1Data || !step2Data) {
                throw new Error('Faltan datos de configuración');
            }

            const tiendaData = JSON.parse(step1Data);
            const categorias = JSON.parse(step2Data);

            // 2. Crear slug único
            const slug = tiendaData.nombre
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            // 3. Crear tienda
            const { data: tienda, error: tiendaError } = await supabase
                .from('tiendas')
                .insert({
                    nombre: tiendaData.nombre,
                    slug: `${slug}-${Date.now()}`,
                    direccion: tiendaData.direccion || null,
                    telefono: tiendaData.telefono || null,
                    email: tiendaData.email || null,
                    activa: true,
                })
                .select()
                .single();

            if (tiendaError) throw tiendaError;

            // 4. Asociar usuario como admin_general
            const { error: usuarioTiendaError } = await supabase
                .from('usuarios_tiendas')
                .insert({
                    usuario_id: user.id,
                    tienda_id: tienda.id,
                    rol: 'admin_general',
                    activo: true,
                });

            if (usuarioTiendaError) throw usuarioTiendaError;

            // 5. Crear categorías
            const categoriasInsert = categorias.map((cat: any, index: number) => ({
                tienda_id: tienda.id,
                nombre: cat.nombre,
                icono: cat.icono,
                orden: index + 1,
                activa: true,
            }));

            const { error: categoriasError } = await supabase
                .from('categorias')
                .insert(categoriasInsert);

            if (categoriasError) throw categoriasError;

            // 6. Limpiar datos temporales
            await AsyncStorage.removeItem('onboarding_step1');
            await AsyncStorage.removeItem('onboarding_step2');

            // 7. Refrescar tiendas en el contexto
            await refreshTiendas();

            // 8. Ir a pantalla de éxito
            router.replace('/onboarding/success');
        } catch (error: any) {
            console.error('Error creating store:', error);
            Alert.alert('Error', error.message || 'No se pudo crear la tienda');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    {/* Progress */}
                    <View style={styles.progress}>
                        <View style={[styles.progressBar, { width: '100%' }]} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.step}>Paso 3 de 3</Text>
                        <Text style={styles.title}>Configuración Inicial</Text>
                        <Text style={styles.subtitle}>
                            Últimos detalles para comenzar
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>💰 Efectivo Inicial</Text>
                            <Text style={styles.cardDescription}>
                                ¿Con cuánto efectivo vas a abrir la caja hoy?
                            </Text>
                            <View style={styles.inputContainer}>
                                <Text style={styles.currency}>$</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="50000"
                                    value={efectivoInicial}
                                    onChangeText={setEfectivoInicial}
                                    keyboardType="numeric"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoIcon}>ℹ️</Text>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoTitle}>¿Qué sigue?</Text>
                                <Text style={styles.infoText}>
                                    • Podrás agregar productos{'\n'}
                                    • Configurar proveedores{'\n'}
                                    • Registrar ventas{'\n'}
                                    • Ver reportes en tiempo real
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.buttonSecondary}
                            onPress={() => router.back()}
                            disabled={loading}
                        >
                            <Text style={styles.buttonSecondaryText}>Atrás</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.buttonPrimary, loading && styles.buttonDisabled]}
                            onPress={handleFinish}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonPrimaryText}>Crear Tienda</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    progress: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        marginBottom: 32,
        marginTop: 40,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 2,
    },
    header: {
        marginBottom: 32,
    },
    step: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    form: {
        flex: 1,
    },
    card: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    currency: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
        marginRight: 8,
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    infoIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 40,
    },
    buttonSecondary: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    buttonSecondaryText: {
        color: '#374151',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonPrimary: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
