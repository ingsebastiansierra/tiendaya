import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type DashboardStats = {
    ventasHoy: number;
    totalProductos: number;
    stockBajo: number;
    totalClientes: number;
};

type Producto = {
    id: string;
    nombre: string;
    precio_venta: number;
    stock_actual: number;
    stock_minimo: number;
    codigo_barras?: string;
    sku?: string;
    categorias?: {
        nombre: string;
    };
};

export default function DashboardScreen() {
    const { usuario, tiendaActual } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        ventasHoy: 0,
        totalProductos: 0,
        stockBajo: 0,
        totalClientes: 0,
    });
    const [loading, setLoading] = useState(true);
    const [modalProductosVisible, setModalProductosVisible] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingProductos, setLoadingProductos] = useState(false);

    useEffect(() => {
        if (tiendaActual?.tiendas?.id) {
            cargarEstadisticas();
        }
    }, [tiendaActual]);

    const cargarProductos = async () => {
        try {
            setLoadingProductos(true);
            const tiendaId = tiendaActual?.tiendas?.id;

            if (!tiendaId) {
                console.log('⚠️ No hay tienda seleccionada');
                return;
            }

            console.log('📦 Cargando productos para tienda:', tiendaId);

            const { data, error } = await supabase
                .from('productos')
                .select(`
                    id,
                    nombre,
                    precio_venta,
                    stock_actual,
                    stock_minimo,
                    codigo_barras,
                    sku,
                    categorias:categoria_id (
                        nombre
                    )
                `)
                .eq('tienda_id', tiendaId)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) {
                console.error('❌ Error cargando productos:', error);
                return;
            }

            console.log('✅ Productos cargados:', data?.length || 0);
            setProductos(data || []);
        } catch (error) {
            console.error('❌ Error cargando productos:', error);
        } finally {
            setLoadingProductos(false);
        }
    };

    const abrirModalProductos = () => {
        setModalProductosVisible(true);
        cargarProductos();
    };

    const cargarEstadisticas = async () => {
        try {
            setLoading(true);
            const tiendaId = tiendaActual?.tiendas?.id;

            if (!tiendaId) {
                console.log('⚠️ No hay tienda seleccionada');
                return;
            }

            console.log('📊 Cargando estadísticas para tienda:', tiendaId);

            // 1. Ventas del día
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const { data: ventasData, error: ventasError } = await supabase
                .from('ventas')
                .select('total')
                .eq('tienda_id', tiendaId)
                .gte('created_at', hoy.toISOString());

            if (ventasError) {
                console.error('❌ Error cargando ventas:', ventasError);
            }

            const totalVentasHoy = ventasData?.reduce((sum, venta) => sum + Number(venta.total), 0) || 0;

            // 2. Total de productos
            const { count: totalProductos, error: productosError } = await supabase
                .from('productos')
                .select('*', { count: 'exact', head: true })
                .eq('tienda_id', tiendaId)
                .eq('activo', true);

            if (productosError) {
                console.error('❌ Error contando productos:', productosError);
            }

            // 3. Productos con stock bajo
            const { data: stockBajoData, error: stockError } = await supabase
                .from('productos')
                .select('id, stock_actual, stock_minimo')
                .eq('tienda_id', tiendaId)
                .eq('activo', true);

            if (stockError) {
                console.error('❌ Error verificando stock:', stockError);
            }

            const productosStockBajo = stockBajoData?.filter(
                p => p.stock_actual <= p.stock_minimo
            ).length || 0;

            // 4. Total de clientes
            const { count: totalClientes, error: clientesError } = await supabase
                .from('clientes')
                .select('*', { count: 'exact', head: true })
                .eq('tienda_id', tiendaId)
                .eq('activo', true);

            if (clientesError) {
                console.error('❌ Error contando clientes:', clientesError);
            }

            setStats({
                ventasHoy: totalVentasHoy,
                totalProductos: totalProductos || 0,
                stockBajo: productosStockBajo,
                totalClientes: totalClientes || 0,
            });

            console.log('✅ Estadísticas cargadas:', {
                ventasHoy: totalVentasHoy,
                totalProductos,
                stockBajo: productosStockBajo,
                totalClientes,
            });
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Cargando estadísticas...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hola, {usuario?.nombre_completo}</Text>
                        <Text style={styles.subtitle}>
                            {tiendaActual?.tiendas?.nombre || 'Bienvenido a tu tienda'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={cargarEstadisticas}
                    >
                        <Text style={styles.refreshIcon}>🔄</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={styles.statIcon}>💰</Text>
                        <Text style={styles.statValue}>
                            ${stats.ventasHoy.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </Text>
                        <Text style={styles.statLabel}>Ventas Hoy</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}
                        onPress={abrirModalProductos}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.statIcon}>📦</Text>
                        <Text style={styles.statValue}>{stats.totalProductos}</Text>
                        <Text style={styles.statLabel}>Productos</Text>
                    </TouchableOpacity>

                    <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={styles.statIcon}>⚠️</Text>
                        <Text style={styles.statValue}>{stats.stockBajo}</Text>
                        <Text style={styles.statLabel}>Stock Bajo</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: '#FCE7F3' }]}>
                        <Text style={styles.statIcon}>👥</Text>
                        <Text style={styles.statValue}>{stats.totalClientes}</Text>
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

            {/* Modal de Productos */}
            <Modal
                visible={modalProductosVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalProductosVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {/* Header del Modal */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📦 Mis Productos</Text>
                            <TouchableOpacity
                                onPress={() => setModalProductosVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Contenido del Modal */}
                        {loadingProductos ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator size="large" color="#10B981" />
                                <Text style={styles.loadingText}>Cargando productos...</Text>
                            </View>
                        ) : productos.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>📦</Text>
                                <Text style={styles.emptyTitle}>No hay productos</Text>
                                <Text style={styles.emptyText}>
                                    Aún no has agregado productos a tu inventario
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={productos}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.productList}
                                renderItem={({ item }) => (
                                    <View style={styles.productCard}>
                                        <View style={styles.productHeader}>
                                            <Text style={styles.productName}>{item.nombre}</Text>
                                            <View style={[
                                                styles.stockBadge,
                                                item.stock_actual <= item.stock_minimo
                                                    ? styles.stockBadgeLow
                                                    : styles.stockBadgeNormal
                                            ]}>
                                                <Text style={styles.stockBadgeText}>
                                                    Stock: {item.stock_actual}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.productDetails}>
                                            {item.categorias && (
                                                <Text style={styles.productCategory}>
                                                    🏷️ {item.categorias.nombre}
                                                </Text>
                                            )}
                                            {item.sku && (
                                                <Text style={styles.productSku}>SKU: {item.sku}</Text>
                                            )}
                                            {item.codigo_barras && (
                                                <Text style={styles.productSku}>
                                                    Código: {item.codigo_barras}
                                                </Text>
                                            )}
                                        </View>

                                        <View style={styles.productFooter}>
                                            <Text style={styles.productPrice}>
                                                ${item.precio_venta.toLocaleString('es-CO')}
                                            </Text>
                                            {item.stock_actual <= item.stock_minimo && (
                                                <Text style={styles.lowStockWarning}>
                                                    ⚠️ Stock bajo
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                            />
                        )}
                    </View>
                </View>
            </Modal>
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
    refreshButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshIcon: {
        fontSize: 24,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    // Estilos del Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#6B7280',
        fontWeight: 'bold',
    },
    modalLoading: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    productList: {
        padding: 16,
    },
    productCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    stockBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stockBadgeNormal: {
        backgroundColor: '#D1FAE5',
    },
    stockBadgeLow: {
        backgroundColor: '#FEE2E2',
    },
    stockBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
    },
    productDetails: {
        marginBottom: 12,
    },
    productCategory: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    productSku: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    lowStockWarning: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '600',
    },
    separator: {
        height: 12,
    },
});
