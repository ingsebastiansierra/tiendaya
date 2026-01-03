import { View, Text, StyleSheet } from 'react-native';

export default function ProveedoresScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Proveedores</Text>
            <Text style={styles.subtitle}>Módulo en construcción</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    subtitle: {
        fontSize: 16,
        color: '#7f8c8d',
        marginTop: 8,
    },
});
