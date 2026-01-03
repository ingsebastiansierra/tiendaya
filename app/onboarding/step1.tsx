import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingStep1() {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');

    const handleNext = async () => {
        if (!nombre) {
            Alert.alert('Error', 'El nombre de la tienda es obligatorio');
            return;
        }

        // Guardar datos temporalmente
        await AsyncStorage.setItem('onboarding_step1', JSON.stringify({
            nombre,
            direccion,
            telefono,
            email,
        }));

        router.push('/onboarding/step2');
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="dark" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    {/* Progress */}
                    <View style={styles.progress}>
                        <View style={[styles.progressBar, { width: '33%' }]} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.step}>Paso 1 de 3</Text>
                        <Text style={styles.title}>Información Básica</Text>
                        <Text style={styles.subtitle}>
                            Cuéntanos sobre tu negocio
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                                Nombre de la tienda <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Tienda Don Pepe"
                                value={nombre}
                                onChangeText={setNombre}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Dirección</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Calle 123 #45-67"
                                value={direccion}
                                onChangeText={setDireccion}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Teléfono</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="3001234567"
                                value={telefono}
                                onChangeText={setTelefono}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email (opcional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="tienda@email.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={styles.buttonSecondary}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.buttonSecondaryText}>Atrás</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.buttonPrimary}
                            onPress={handleNext}
                        >
                            <Text style={styles.buttonPrimaryText}>Siguiente</Text>
                        </TouchableOpacity>
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
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
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
    buttonPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
