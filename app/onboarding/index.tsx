import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingWelcome() {
    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                <Text style={styles.emoji}>🎉</Text>
                <Text style={styles.title}>¡Bienvenido!</Text>
                <Text style={styles.subtitle}>
                    Vamos a configurar tu primera tienda en 3 simples pasos
                </Text>

                <View style={styles.steps}>
                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepText}>Información básica</Text>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>Categorías de productos</Text>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepText}>Configuración inicial</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/onboarding/step1')}
                >
                    <Text style={styles.buttonText}>Comenzar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 80,
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 48,
        paddingHorizontal: 20,
    },
    steps: {
        width: '100%',
        marginBottom: 48,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    stepNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    stepText: {
        fontSize: 16,
        color: '#374151',
        flex: 1,
    },
    button: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
