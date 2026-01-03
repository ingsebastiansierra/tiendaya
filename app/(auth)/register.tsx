import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RegisterScreen() {
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        // Validaciones
        if (!nombreCompleto || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, nombreCompleto);
            Alert.alert(
                'Registro exitoso',
                'Tu cuenta ha sido creada. Ahora puedes crear tu primera tienda.',
                [{ text: 'Continuar', onPress: () => router.replace('/') }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo crear la cuenta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="dark" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.logo}>🏪</Text>
                        <Text style={styles.title}>Crear Cuenta</Text>
                        <Text style={styles.subtitle}>Comienza a gestionar tu negocio</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre completo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Juan Pérez"
                                value={nombreCompleto}
                                onChangeText={setNombreCompleto}
                                autoCapitalize="words"
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Correo electrónico</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="tu@email.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Contraseña</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirmar contraseña</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Repite tu contraseña"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Crear Cuenta</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                            <Link href="/(auth)/login" asChild>
                                <TouchableOpacity disabled={loading}>
                                    <Text style={styles.link}>Inicia sesión</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 40,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
    },
    button: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 40,
    },
    footerText: {
        fontSize: 14,
        color: '#6B7280',
    },
    link: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
});
