import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function DashboardScreen() {
    const { usuario, tiendaActual } = useAuth();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hola, {usuario?.nombre_completo}</Text>
                        <Text style={styles.subtitle}>Bienvenido a tu tienda</Text>
                    </View>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {usuario?.nombre_completo?.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={styles.statIcon}>💰</Text>
                        <Text style={styles.statValue}>$0</Text>
                        <Text style={styles.statLabel}>Ventas Hoy</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={styles.statIcon}>📦</Text>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Productos</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={styles.statIcon}>⚠️</Text>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Stock Bajo</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#FCE7F3' }]}>
                        <Text style={styles.statIcon}>👥</Text>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Clientes</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={styles.actionIcon}>
                            <Text style={styles.actionIconText}>➕</Text>
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Agregar Producto</Text>
                            <Text style={styles.actionDescription}>
                                Añade productos a tu inventario
                            </Text>
                        </View>
                        <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={styles.actionIcon}>
                            <Text style={styles.actionIconText}>💳</Text>
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Nueva Venta</Text>
                            <Text style={styles.actionDescription}>
                                Registra una venta rápidamente
                            </Text>
                        </View>
                        <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={styles.actionIcon}>
                            <Text style={styles.actionIconText}>📊</Text>
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Ver Reportes</Text>
                            <Text style={styles.actionDescription}>
                                Consulta tus estadísticas
                            </Text>
                        </View>
                        <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#fff',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    statCard: {
        width: '47%',
        borderRadius: 16,
        padding: 16,
    },
    statIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionIconText: {
        fontSize: 24,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    actionArrow: {
        fontSize: 24,
        color: '#9CA3AF',
    },
});
