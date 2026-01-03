import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function PerfilScreen() {
    const { usuario, signOut } = useAuth();

    const handleSignOut = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas salir?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {usuario?.nombre_completo?.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.name}>{usuario?.nombre_completo}</Text>
                <Text style={styles.email}>{usuario?.email}</Text>
            </View>

            <View style={styles.section}>
                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionIcon}>👤</Text>
                    <Text style={styles.optionText}>Editar Perfil</Text>
                    <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionIcon}>🏪</Text>
                    <Text style={styles.optionText}>Mis Tiendas</Text>
                    <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionIcon}>⚙️</Text>
                    <Text style={styles.optionText}>Configuración</Text>
                    <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option}>
                    <Text style={styles.optionIcon}>❓</Text>
                    <Text style={styles.optionText}>Ayuda</Text>
                    <Text style={styles.optionArrow}>›</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#fff',
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    optionArrow: {
        fontSize: 24,
        color: '#9CA3AF',
    },
    signOutButton: {
        margin: 24,
        padding: 16,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        alignItems: 'center',
    },
    signOutText: {
        color: '#DC2626',
        fontSize: 16,
        fontWeight: '600',
    },
});
