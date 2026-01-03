import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIAS_SUGERIDAS = [
    { nombre: 'Papelería', icono: '📝', seleccionada: false },
    { nombre: 'Cervezas', icono: '🍺', seleccionada: false },
    { nombre: 'Bebidas', icono: '🥤', seleccionada: false },
    { nombre: 'Onces', icono: '🍔', seleccionada: false },
    { nombre: 'Snacks', icono: '🍿', seleccionada: false },
    { nombre: 'Dulces', icono: '🍬', seleccionada: false },
    { nombre: 'Aseo', icono: '🧹', seleccionada: false },
    { nombre: 'Cigarrillos', icono: '🚬', seleccionada: false },
    { nombre: 'Frutas', icono: '🍎', seleccionada: false },
    { nombre: 'Verduras', icono: '🥬', seleccionada: false },
    { nombre: 'Lácteos', icono: '🥛', seleccionada: false },
    { nombre: 'Panadería', icono: '🍞', seleccionada: false },
];

export default function OnboardingStep2() {
    const [categorias, setCategorias] = useState(CATEGORIAS_SUGERIDAS);

    const toggleCategoria = (index: number) => {
        const newCategorias = [...categorias];
        newCategorias[index].seleccionada = !newCategorias[index].seleccionada;
        setCategorias(newCategorias);
    };

    const handleNext = async () => {
        const seleccionadas = categorias.filter(c => c.seleccionada);

        if (seleccionadas.length === 0) {
            Alert.alert('Error', 'Selecciona al menos una categoría');
            return;
        }

        // Guardar categorías seleccionadas
        await AsyncStorage.setItem('onboarding_step2', JSON.stringify(seleccionadas));
        router.push('/onboarding/step3');
    };

    const seleccionadas = categorias.filter(c => c.seleccionada).length;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.content}>
                {/* Progress */}
                <View style={styles.progress}>
                    <View style={[styles.progressBar, { width: '66%' }]} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.step}>Paso 2 de 3</Text>
                    <Text style={styles.title}>Categorías de Productos</Text>
                    <Text style={styles.subtitle}>
                        Selecciona las categorías que vendes ({seleccionadas} seleccionadas)
                    </Text>
                </View>

                {/* Categorías Grid */}
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.grid}>
                        {categorias.map((categoria, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.card,
                                    categoria.seleccionada && styles.cardSelected,
                                ]}
                                onPress={() => toggleCategoria(index)}
                            >
                                <Text style={styles.cardEmoji}>{categoria.icono}</Text>
                                <Text style={[
                                    styles.cardText,
                                    categoria.seleccionada && styles.cardTextSelected,
                                ]}>
                                    {categoria.nombre}
                                </Text>
                                {categoria.seleccionada && (
                                    <View style={styles.checkmark}>
                                        <Text style={styles.checkmarkText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

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
        marginBottom: 24,
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
    scrollView: {
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    card: {
        width: '47%',
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        position: 'relative',
    },
    cardSelected: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    cardEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    cardText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    cardTextSelected: {
        color: '#10B981',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        marginBottom: 20,
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
