import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, ActivityIndicator, Alert, FlatList, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Sesion = {
    id: string;
    efectivo_inicial: number;
    fecha_apertura: string;
    cerrada: boolean;
};

type Producto = {
    id: string;
    nombre: string;
    precio_venta: number;
    stock_actual: number;
    codigo_barras?: string;
    sku?: string;
    imagen_url?: string;
    categorias?: {
        nombre: string;
        icono?: string;
    };
};

type ItemCarrito = {
    producto: Producto;
    cantidad: number;
    subtotal: number;
};

type TipoPago = {
    id: string;
    nombre: string;
    codigo: string;
    icono?: string;
};

export default function VentasScreen() {
    const { tiendaActual, usuario } = useAuth();
    const [sesionActual, setSesionActual] = useState<Sesion | null>(null);
    const [loading, setLoading] = useState(true);
    const [modalAperturaVisible, setModalAperturaVisible] = useState(false);
    const [efectivoInicial, setEfectivoInicial] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Estados para el punto de venta
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);
    const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState<string>('');
    const [modalPagoVisible, setModalPagoVisible] = useState(false);
    const [referenciaPago, setReferenciaPago] = useState('');
    const [ventasDelDia, setVentasDelDia] = useState<any[]>([]);
    const [resumenDia, setResumenDia] = useState({
        totalVentas: 0,
        numeroVentas: 0,
        efectivo: 0,
        tarjeta: 0,
        otros: 0,
    });

    useEffect(() => {
        if (tiendaActual?.tiendas?.id) {
            verificarSesion();
            cargarProductos();
            cargarTiposPago();
        }
    }, [tiendaActual]);

    useEffect(() => {
        if (sesionActual) {
            cargarVentasDelDia();
        }
    }, [sesionActual]);

    useEffect(() => {
        filtrarProductos();
    }, [busqueda, productos]);

    const verificarSesion = async () => {
        try {
            setLoading(true);
            const tiendaId = tiendaActual?.tiendas?.id;
            if (!tiendaId) return;

            const { data, error } = await supabase
                .from('sesiones')
                .select('*')
                .eq('tienda_id', tiendaId)
                .eq('cerrada', false)
                .order('fecha_apertura', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Error verificando sesión:', error);
            }

            setSesionActual(data || null);
        } catch (error) {
            console.error('❌ Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarProductos = async () => {
        try {
            const tiendaId = tiendaActual?.tiendas?.id;
            if (!tiendaId) return;

            const { data, error } = await supabase
                .from('productos')
                .select(`
                    id,
                    nombre,
                    precio_venta,
                    stock_actual,
                    codigo_barras,
                    sku,
                    imagen_url,
                    categorias:categoria_id (
                        nombre,
                        icono
                    )
                `)
                .eq('tienda_id', tiendaId)
                .eq('activo', true)
                .gt('stock_actual', 0)
                .order('nombre', { ascending: true });

            if (error) {
                console.error('❌ Error cargando productos:', error);
                return;
            }

            setProductos(data || []);
        } catch (error) {
            console.error('❌ Error:', error);
        }
    };

    const cargarTiposPago = async () => {
        try {
            const tiendaId = tiendaActual?.tiendas?.id;
            if (!tiendaId) return;

            const { data, error } = await supabase
                .from('tipos_pago')
                .select('id, nombre, codigo, icono')
                .or(`tienda_id.eq.${tiendaId},tienda_id.is.null`)
                .eq('activo', true)
                .order('orden', { ascending: true });

            if (error) {
                console.error('❌ Error cargando tipos de pago:', error);
                return;
            }

            setTiposPago(data || []);
            if (data && data.length > 0) {
                setTipoPagoSeleccionado(data[0].id);
            }
        } catch (error) {
            console.error('❌ Error:', error);
        }
    };

    const cargarVentasDelDia = async () => {
        try {
            if (!sesionActual) return;

            const { data, error } = await supabase
                .from('ventas')
                .select(`
                    id,
                    numero_venta,
                    total,
                    created_at,
                    tipos_pago:tipo_pago_id (
                        nombre,
                        icono
                    ),
                    ventas_detalle (
                        cantidad,
                        productos (
                            nombre
                        )
                    )
                `)
                .eq('sesion_id', sesionActual.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error cargando ventas:', error);
                return;
            }

            setVentasDelDia(data || []);

            // Calcular resumen
            const total = data?.reduce((sum, v) => sum + Number(v.total), 0) || 0;
            const efectivo = data?.filter(v => v.tipos_pago?.nombre === 'Efectivo')
                .reduce((sum, v) => sum + Number(v.total), 0) || 0;
            const tarjeta = data?.filter(v =>
                v.tipos_pago?.nombre?.includes('Tarjeta'))
                .reduce((sum, v) => sum + Number(v.total), 0) || 0;
            const otros = total - efectivo - tarjeta;

            setResumenDia({
                totalVentas: total,
                numeroVentas: data?.length || 0,
                efectivo,
                tarjeta,
                otros,
            });
        } catch (error) {
            console.error('❌ Error:', error);
        }
    };

    const filtrarProductos = () => {
        if (!busqueda.trim()) {
            setProductosFiltrados([]);
            return;
        }

        const busquedaLower = busqueda.toLowerCase();
        const resultado = productos.filter(p =>
            p.nombre.toLowerCase().includes(busquedaLower) ||
            p.sku?.toLowerCase().includes(busquedaLower) ||
            p.codigo_barras?.toLowerCase().includes(busquedaLower)
        );

        setProductosFiltrados(resultado);
    };

    const abrirCaja = async () => {
        const efectivo = parseFloat(efectivoInicial);
        if (isNaN(efectivo) || efectivo < 0) {
            Alert.alert('Error', 'Ingresa un monto válido');
            return;
        }

        try {
            setGuardando(true);

            const { data, error } = await supabase
                .from('sesiones')
                .insert([{
                    tienda_id: tiendaActual?.tiendas?.id,
                    usuario_id: usuario?.id,
                    efectivo_inicial: efectivo,
                    cerrada: false,
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ Error abriendo caja:', error);
                Alert.alert('Error', 'No se pudo abrir la caja');
                return;
            }

            setSesionActual(data);
            setModalAperturaVisible(false);
            setEfectivoInicial('');
            Alert.alert('Éxito', 'Caja abierta correctamente');
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'No se pudo abrir la caja');
        } finally {
            setGuardando(false);
        }
    };

    const agregarAlCarrito = (producto: Producto) => {
        const itemExistente = carrito.find(item => item.producto.id === producto.id);

        if (itemExistente) {
            if (itemExistente.cantidad >= producto.stock_actual) {
                Alert.alert('Stock insuficiente', `Solo hay ${producto.stock_actual} unidades disponibles`);
                return;
            }

            setCarrito(carrito.map(item =>
                item.producto.id === producto.id
                    ? {
                        ...item,
                        cantidad: item.cantidad + 1,
                        subtotal: (item.cantidad + 1) * producto.precio_venta
                    }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                producto,
                cantidad: 1,
                subtotal: producto.precio_venta
            }]);
        }

        setBusqueda('');
        setProductosFiltrados([]);
    };

    const modificarCantidad = (productoId: string, nuevaCantidad: number) => {
        const item = carrito.find(i => i.producto.id === productoId);
        if (!item) return;

        if (nuevaCantidad <= 0) {
            eliminarDelCarrito(productoId);
            return;
        }

        if (nuevaCantidad > item.producto.stock_actual) {
            Alert.alert('Stock insuficiente', `Solo hay ${item.producto.stock_actual} unidades disponibles`);
            return;
        }

        setCarrito(carrito.map(i =>
            i.producto.id === productoId
                ? {
                    ...i,
                    cantidad: nuevaCantidad,
                    subtotal: nuevaCantidad * i.producto.precio_venta
                }
                : i
        ));
    };

    const eliminarDelCarrito = (productoId: string) => {
        setCarrito(carrito.filter(item => item.producto.id !== productoId));
    };

    const calcularTotal = () => {
        return carrito.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const procesarVenta = async () => {
        if (carrito.length === 0) {
            Alert.alert('Error', 'El carrito está vacío');
            return;
        }

        if (!tipoPagoSeleccionado) {
            Alert.alert('Error', 'Selecciona un método de pago');
            return;
        }

        try {
            setGuardando(true);

            const total = calcularTotal();
            const numeroVenta = `V-${Date.now()}`;

            // Crear venta
            const { data: venta, error: ventaError } = await supabase
                .from('ventas')
                .insert([{
                    tienda_id: tiendaActual?.tiendas?.id,
                    sesion_id: sesionActual?.id,
                    usuario_id: usuario?.id,
                    numero_venta: numeroVenta,
                    subtotal: total,
                    descuento: 0,
                    total: total,
                    tipo_pago_id: tipoPagoSeleccionado,
                    referencia_pago: referenciaPago || null,
                    estado: 'completada',
                    pagada: true,
                }])
                .select()
                .single();

            if (ventaError) {
                console.error('❌ Error creando venta:', ventaError);
                Alert.alert('Error', 'No se pudo procesar la venta');
                return;
            }

            // Crear detalles de venta
            const detalles = carrito.map(item => ({
                venta_id: venta.id,
                producto_id: item.producto.id,
                cantidad: item.cantidad,
                precio_unitario: item.producto.precio_venta,
                subtotal: item.subtotal,
            }));

            const { error: detallesError } = await supabase
                .from('ventas_detalle')
                .insert(detalles);

            if (detallesError) {
                console.error('❌ Error creando detalles:', detallesError);
                Alert.alert('Error', 'No se pudo completar la venta');
                return;
            }

            // Actualizar stock de productos
            for (const item of carrito) {
                const nuevoStock = item.producto.stock_actual - item.cantidad;
                await supabase
                    .from('productos')
                    .update({ stock_actual: nuevoStock })
                    .eq('id', item.producto.id);
            }

            // Limpiar carrito y cerrar modal
            setCarrito([]);
            setModalPagoVisible(false);
            setReferenciaPago('');
            Alert.alert('Éxito', `Venta ${numeroVenta} procesada correctamente`);

            // Recargar productos y ventas del día
            cargarProductos();
            cargarVentasDelDia();
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'No se pudo procesar la venta');
        } finally {
            setGuardando(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Cargando...</Text>
                </View>
            </View>
        );
    }

    // Si no hay sesión abierta, mostrar pantalla de apertura
    if (!sesionActual) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.noSessionContainer}>
                    <Text style={styles.noSessionIcon}>🔒</Text>
                    <Text style={styles.noSessionTitle}>Caja Cerrada</Text>
                    <Text style={styles.noSessionText}>
                        Debes abrir la caja para comenzar a vender
                    </Text>
                    <TouchableOpacity
                        style={styles.openCashButton}
                        onPress={() => setModalAperturaVisible(true)}
                    >
                        <Text style={styles.openCashButtonText}>🔓 Abrir Caja</Text>
                    </TouchableOpacity>
                </View>

                {/* Modal de Apertura de Caja */}
                <Modal
                    visible={modalAperturaVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setModalAperturaVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>🔓 Abrir Caja</Text>
                                <TouchableOpacity
                                    onPress={() => setModalAperturaVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalContent}>
                                <Text style={styles.formLabel}>Efectivo Inicial</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="0"
                                    keyboardType="numeric"
                                    value={efectivoInicial}
                                    onChangeText={setEfectivoInicial}
                                    placeholderTextColor="#9CA3AF"
                                    autoFocus
                                />

                                <TouchableOpacity
                                    style={[styles.submitButton, guardando && styles.submitButtonDisabled]}
                                    onPress={abrirCaja}
                                    disabled={guardando}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {guardando ? 'Abriendo...' : '✓ Abrir Caja'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // Punto de Venta
    const total = calcularTotal();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header con resumen del día */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>💰 Caja del Día</Text>
                    <Text style={styles.subtitle}>
                        {resumenDia.numeroVentas} ventas - ${resumenDia.totalVentas.toLocaleString('es-CO')}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.cashInitialLabel}>Efectivo Inicial</Text>
                    <Text style={styles.cashInitialValue}>
                        ${sesionActual.efectivo_inicial.toLocaleString('es-CO')}
                    </Text>
                </View>
            </View>

            {/* Resumen rápido */}
            <View style={styles.quickSummary}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryIcon}>💵</Text>
                    <Text style={styles.summaryValue}>${resumenDia.efectivo.toLocaleString('es-CO')}</Text>
                    <Text style={styles.summaryLabel}>Ventas Efectivo</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryIcon}>💰</Text>
                    <Text style={styles.summaryValue}>
                        ${(sesionActual.efectivo_inicial + resumenDia.efectivo).toLocaleString('es-CO')}
                    </Text>
                    <Text style={styles.summaryLabel}>Total en Caja</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryIcon}>💳</Text>
                    <Text style={styles.summaryValue}>${resumenDia.tarjeta.toLocaleString('es-CO')}</Text>
                    <Text style={styles.summaryLabel}>Tarjetas</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryIcon}>📱</Text>
                    <Text style={styles.summaryValue}>${resumenDia.otros.toLocaleString('es-CO')}</Text>
                    <Text style={styles.summaryLabel}>Otros</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContent}>
                {/* Buscador de productos */}
                <View style={styles.searchSection}>
                    <Text style={styles.sectionTitle}>🛒 Nueva Venta</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChangeText={setBusqueda}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Resultados de búsqueda */}
                {productosFiltrados.length > 0 && (
                    <View style={styles.searchResultsContainer}>
                        <Text style={styles.searchResultsTitle}>Resultados ({productosFiltrados.length})</Text>
                        {productosFiltrados.map((producto) => (
                            <TouchableOpacity
                                key={producto.id}
                                style={styles.searchResultItem}
                                onPress={() => agregarAlCarrito(producto)}
                            >
                                {producto.imagen_url ? (
                                    <Image
                                        source={{ uri: producto.imagen_url }}
                                        style={styles.searchResultImage}
                                    />
                                ) : (
                                    <View style={styles.searchResultImagePlaceholder}>
                                        <Text style={styles.searchResultImageIcon}>
                                            {producto.categorias?.icono || '📦'}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.searchResultInfo}>
                                    <Text style={styles.searchResultName}>{producto.nombre}</Text>
                                    <Text style={styles.searchResultPrice}>
                                        ${producto.precio_venta.toLocaleString('es-CO')}
                                    </Text>
                                </View>
                                <Text style={styles.searchResultAdd}>➕</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Carrito actual */}
                {carrito.length > 0 && (
                    <View style={styles.currentCart}>
                        <Text style={styles.sectionTitle}>🛒 Carrito Actual</Text>
                        {carrito.map((item) => (
                            <View key={item.producto.id} style={styles.cartItemCompact}>
                                <View style={styles.cartItemCompactInfo}>
                                    <Text style={styles.cartItemCompactName}>{item.producto.nombre}</Text>
                                    <Text style={styles.cartItemCompactPrice}>
                                        ${item.producto.precio_venta.toLocaleString('es-CO')} x {item.cantidad}
                                    </Text>
                                </View>
                                <View style={styles.cartItemCompactActions}>
                                    <TouchableOpacity
                                        style={styles.cartItemCompactButton}
                                        onPress={() => modificarCantidad(item.producto.id, item.cantidad - 1)}
                                    >
                                        <Text style={styles.cartItemCompactButtonText}>➖</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.cartItemCompactQuantity}>{item.cantidad}</Text>
                                    <TouchableOpacity
                                        style={styles.cartItemCompactButton}
                                        onPress={() => modificarCantidad(item.producto.id, item.cantidad + 1)}
                                    >
                                        <Text style={styles.cartItemCompactButtonText}>➕</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.cartItemCompactSubtotal}>
                                    ${item.subtotal.toLocaleString('es-CO')}
                                </Text>
                            </View>
                        ))}
                        <View style={styles.cartTotalCompact}>
                            <Text style={styles.cartTotalCompactLabel}>TOTAL:</Text>
                            <Text style={styles.cartTotalCompactValue}>
                                ${total.toLocaleString('es-CO')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.payButtonCompact}
                            onPress={() => setModalPagoVisible(true)}
                        >
                            <Text style={styles.payButtonCompactText}>💳 Procesar Pago</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Ventas del día (Cuaderno digital) */}
                <View style={styles.salesLog}>
                    <Text style={styles.sectionTitle}>📋 Ventas del Día</Text>
                    {ventasDelDia.length === 0 ? (
                        <View style={styles.emptySales}>
                            <Text style={styles.emptySalesText}>No hay ventas registradas aún</Text>
                        </View>
                    ) : (
                        ventasDelDia.map((venta, index) => {
                            const hora = new Date(venta.created_at).toLocaleTimeString('es-CO', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            const productos = venta.ventas_detalle?.map((d: any) =>
                                `${d.productos?.nombre} (${d.cantidad})`
                            ).join(', ') || 'Sin detalles';

                            return (
                                <View key={venta.id} style={styles.saleItem}>
                                    <View style={styles.saleItemHeader}>
                                        <Text style={styles.saleItemNumber}>#{ventasDelDia.length - index}</Text>
                                        <Text style={styles.saleItemTime}>{hora}</Text>
                                        <Text style={styles.saleItemTotal}>
                                            ${Number(venta.total).toLocaleString('es-CO')}
                                        </Text>
                                    </View>
                                    <Text style={styles.saleItemProducts} numberOfLines={1}>
                                        {productos}
                                    </Text>
                                    <View style={styles.saleItemFooter}>
                                        <Text style={styles.saleItemPayment}>
                                            {venta.tipos_pago?.icono} {venta.tipos_pago?.nombre}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* Modal de Pago */}
            <Modal
                visible={modalPagoVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalPagoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerLarge}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>💳 Procesar Pago</Text>
                            <TouchableOpacity
                                onPress={() => setModalPagoVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <View style={styles.paymentTotal}>
                                <Text style={styles.paymentTotalLabel}>Total a pagar</Text>
                                <Text style={styles.paymentTotalValue}>
                                    ${total.toLocaleString('es-CO')}
                                </Text>
                            </View>

                            <Text style={styles.formLabel}>Método de Pago</Text>
                            <View style={styles.paymentMethods}>
                                {tiposPago.map((tipo) => (
                                    <TouchableOpacity
                                        key={tipo.id}
                                        style={[
                                            styles.paymentMethod,
                                            tipoPagoSeleccionado === tipo.id && styles.paymentMethodActive
                                        ]}
                                        onPress={() => setTipoPagoSeleccionado(tipo.id)}
                                    >
                                        <Text style={styles.paymentMethodIcon}>{tipo.icono || '💵'}</Text>
                                        <Text style={[
                                            styles.paymentMethodText,
                                            tipoPagoSeleccionado === tipo.id && styles.paymentMethodTextActive
                                        ]}>
                                            {tipo.nombre}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>Referencia (opcional)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Número de transacción, cheque, etc."
                                    value={referenciaPago}
                                    onChangeText={setReferenciaPago}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.submitButton, guardando && styles.submitButtonDisabled]}
                                onPress={procesarVenta}
                                disabled={guardando}
                            >
                                <Text style={styles.submitButtonText}>
                                    {guardando ? 'Procesando...' : '✓ Confirmar Venta'}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.modalBottomMargin} />
                        </ScrollView>
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
    noSessionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    noSessionIcon: {
        fontSize: 80,
        marginBottom: 24,
    },
    noSessionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    noSessionText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    openCashButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    openCashButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    cashInitialLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 2,
    },
    cashInitialValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    searchSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
    },
    searchInput: {
        height: 48,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 2,
        borderColor: '#10B981',
    },
    searchResultsContainer: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    searchResultsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    searchResults: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: 300,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    searchResultsList: {
        maxHeight: 300,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 8,
    },
    searchResultImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    searchResultImagePlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchResultImageIcon: {
        fontSize: 24,
    },
    searchResultInfo: {
        flex: 1,
        marginLeft: 12,
    },
    searchResultName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    searchResultPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 2,
    },
    searchResultStock: {
        fontSize: 12,
        color: '#6B7280',
    },
    searchResultAdd: {
        fontSize: 24,
        color: '#10B981',
    },
    cartSection: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    cartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
    },
    emptyCart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCartIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyCartText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    cartList: {
        flex: 1,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 8,
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    cartItemPrice: {
        fontSize: 12,
        color: '#6B7280',
    },
    cartItemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    cartItemButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartItemButtonText: {
        fontSize: 16,
        color: '#fff',
    },
    cartItemQuantity: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginHorizontal: 12,
        minWidth: 30,
        textAlign: 'center',
    },
    cartItemDelete: {
        marginLeft: 8,
    },
    cartItemDeleteText: {
        fontSize: 20,
    },
    cartItemSubtotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
        minWidth: 80,
        textAlign: 'right',
    },
    cartFooter: {
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
        paddingTop: 16,
        marginTop: 16,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10B981',
    },
    payButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    payButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '50%',
    },
    modalContainerLarge: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
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
    modalContent: {
        padding: 20,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    formInput: {
        height: 56,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    formSection: {
        marginBottom: 20,
    },
    submitButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalBottomMargin: {
        height: 40,
    },
    paymentTotal: {
        backgroundColor: '#F0FDF4',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    paymentTotalLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    paymentTotalValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#10B981',
    },
    paymentMethods: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    paymentMethod: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    paymentMethodActive: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    paymentMethodIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    paymentMethodText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    paymentMethodTextActive: {
        color: '#10B981',
    },
    quickSummary: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    summaryIcon: {
        fontSize: 20,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 2,
    },
    summaryLabel: {
        fontSize: 9,
        color: '#6B7280',
        textAlign: 'center',
    },
    scrollContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    currentCart: {
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#10B981',
    },
    cartItemCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cartItemCompactInfo: {
        flex: 1,
    },
    cartItemCompactName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    cartItemCompactPrice: {
        fontSize: 11,
        color: '#6B7280',
    },
    cartItemCompactActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    cartItemCompactButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartItemCompactButtonText: {
        fontSize: 14,
        color: '#fff',
    },
    cartItemCompactQuantity: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
        marginHorizontal: 8,
        minWidth: 24,
        textAlign: 'center',
    },
    cartItemCompactSubtotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
        minWidth: 70,
        textAlign: 'right',
    },
    cartTotalCompact: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#10B981',
    },
    cartTotalCompactLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    cartTotalCompactValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
    },
    payButtonCompact: {
        backgroundColor: '#10B981',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    payButtonCompactText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    salesLog: {
        backgroundColor: '#fff',
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
    },
    emptySales: {
        padding: 20,
        alignItems: 'center',
    },
    emptySalesText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    saleItem: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    saleItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    saleItemNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
    },
    saleItemTime: {
        fontSize: 12,
        color: '#6B7280',
    },
    saleItemTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    saleItemProducts: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 6,
    },
    saleItemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    saleItemPayment: {
        fontSize: 11,
        color: '#9CA3AF',
    },
});
