import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function OnboardingSuccess() {
    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                <Text style={styles.emoji}>🎉</Text>
                <Text style={styles.title}>¡Tienda Creada!</Text>
                <Text style={styles.subtitle}>
                    Tu tienda está lista para comenzar a vender
                </Text>

                <View style={styles.features}>
                    <View style={styles.feature}>
                        <Text style={styles.featureIcon}>✅</Text>
                        <Text style={styles.featureText}>Categorías configuradas</Text>
                    </View>
                    <View style={styles.feature}>
                        <Text style={styles.featureIcon}>✅</Text>
                        <Text style={styles.featureText}>Caja inicial lista</Text>
                    </View>
                    <View style={styles.feature}>
                        <Text style={styles.featureIcon}>✅</Text>
                        <Text style={styles.featureText}>Sistema de pagos activo</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Text style={styles.buttonText}>Ir al Dashboard</Text>
                </TouchableOpacity>

                <Text style={styles.hint}>
                    Ahora puedes agregar productos y comenzar a vender
                </Text>
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
        fontSize: 100,
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
    features: {
        width: '100%',
        marginBottom: 48,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    featureText: {
        fontSize: 16,
        color: '#374151',
    },
    button: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    hint: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
