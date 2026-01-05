import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Swipeable from 'react-native-gesture-handler/Swipeable';

type Mesa = {
    id: string;
    numero_mesa: string;
    estado: string;
    total_mesa: number;
    total_pagado: number;
    total_pendiente: number;
    created_at: string;
    clientes?: Cliente[];
};

type Cliente = {
    id: string;
    nombre_cliente: string;
    estado: string;
    total: number;
    created_at: string;
    productos?: ProductoDetalle[];
};

type ProductoDetalle = {
    id: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    productos: {
        nombre: string;
    };
};

type Producto = {
    id: string;
    nombre: string;
    precio_venta: number;
    stock_actual: number;
    categoria_id?: string;
};

type Categoria = {
    id: string;
    nombre: string;
    icono: string;
};

export default function MesasScreen() {
    const { tiendaActual, usuario } = useAuth();
    const [mesas, setMesas] = useState<Mesa[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalNuevaMesaVisible, setModalNuevaMesaVisible] = useState(false);
    const [modalMesaDetalleVisible, setModalMesaDetalleVisible] = useState(false);
    const [modalNuevoClienteVisible, setModalNuevoClienteVisible] = useState(false);
    const [modalAgregarProductoVisible, setModalAgregarProductoVisible] = useState(false);
    const [numeroMesa, setNumeroMesa] = useState('');
    const [nombreCliente, setNombreCliente] = useState('');
    const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
    const [modalCantidadVisible, setModalCantidadVisible] = useState(false);
    const [productoParaAgregar, setProductoParaAgregar] = useState<Producto | null>(null);
    const [cantidadProducto, setCantidadProducto] = useState('1');
    const [modalCobrarVisible, setModalCobrarVisible] = useState(false);
    const [clienteParaCobrar, setClienteParaCobrar] = useState<Cliente | null>(null);
    const [tiposPago, setTiposPago] = useState<any[]>([]);
    const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState<string | null>(null);

    useEffect(() => {
        if (tiendaActual?.tiendas?.id) {
            cargarMesas();
            cargarProductos();
            cargarCategorias();
            cargarTiposPago();
        }
    }, [tiendaActual]);

    useEffect(() => {
        filtrarProductos();
    }, [busqueda, productos, categoriaSeleccionada]);

    const cargarMesas = async () => {
        try {
            setLoading(true);
            const tiendaId = tiendaActual?.tiendas?.id;
            if (!tiendaId) return;

            // Cargar mesas
            const { data: mesasData, error: mesasError } = await supabase
                .from('mesas')
                .select('*')
                .eq('tienda_id', tiendaId)
                .eq('estado', 'abierta')
                .order('created_at', { ascending: false });

            if (mesasError) {
                console.error('❌ Error cargando mesas:', mesasError);
                return;
            }

            if (!mesasData || mesasData.length === 0) {
                setMesas([]);
                return;
            }

            // Cargar clientes de todas las mesas
            const mesaIds = mesasData.map(m => m.id);
            const { data: clientesData, error: clientesError } = await supabase
                .from('mesas_clientes')
                .select('*')
                .in('mesa_id', mesaIds)
                .order('created_at', { ascending: true });

            if (clientesError) {
                console.error('❌ Error cargando clientes:', clientesError);
                setMesas(mesasData.map(m => ({ ...m, clientes: [] })));
                return;
            }

            // Cargar detalles de productos de todos los clientes
            const clienteIds = clientesData?.map(c => c.id) || [];
            let detallesData: any[] = [];

            if (clienteIds.length > 0) {
                const { data: detallesRaw, error: detallesError } = await supabase
                    .from('mesas_clientes_detalle')
                    .select('*')
                    .in('mesa_cliente_id', clienteIds);

                if (detallesError) {
                    console.error('❌ Error cargando detalles:', detallesError);
                } else if (detallesRaw && detallesRaw.length > 0) {
                    // Cargar nombres de productos por separado
                    const productoIds = detallesRaw.map(d => d.producto_id);
                    const { data: productosData, error: productosError } = await supabase
                        .from('productos')
                        .select('id, nombre')
                        .in('id', productoIds);

                    if (productosError) {
                        console.error('❌ Error cargando productos:', productosError);
                        detallesData = detallesRaw.map(d => ({ ...d, productos: { nombre: 'Producto' } }));
                    } else {
                        // Combinar detalles con nombres de productos
                        detallesData = detallesRaw.map(detalle => ({
                            ...detalle,
                            productos: productosData?.find(p => p.id === detalle.producto_id) || { nombre: 'Producto' }
                        }));
                    }
                } else {
                    detallesData = [];
                }
            }

            // Combinar todos los datos
            const mesasConClientes = mesasData.map(mesa => {
                const clientesDeMesa = clientesData?.filter(c => c.mesa_id === mesa.id) || [];
                const clientesConProductos = clientesDeMesa.map(cliente => ({
                    ...cliente,
                    productos: detallesData.filter(d => d.mesa_cliente_id === cliente.id)
                }));

                return {
                    ...mesa,
                    clientes: clientesConProductos
                };
            });

            setMesas(mesasConClientes);
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
                .select('id, nombre, precio_venta, stock_actual, categoria_id')
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

    const cargarCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('id, nombre, icono')
                .eq('activa', true)
                .order('nombre', { ascending: true });

            if (error) {
                console.error('❌ Error cargando categorías:', error);
                return;
            }

            setCategorias(data || []);
        } catch (error) {
            console.error('❌ Error:', error);
        }
    };

    const cargarTiposPago = async () => {
        try {
            const { data, error } = await supabase
                .from('tipos_pago')
                .select('*')
                .order('orden', { ascending: true });

            if (error) {
                console.error('❌ Error cargando tipos de pago:', error);
                return;
            }

            setTiposPago(data || []);
        } catch (error) {
            console.error('❌ Error:', error);
        }
    };

    const filtrarProductos = () => {
        let resultado = productos;

        // Filtrar por categoría si hay una seleccionada
        if (categoriaSeleccionada) {
            resultado = resultado.filter(p => p.categoria_id === categoriaSeleccionada);
        }

        // Filtrar por búsqueda si hay texto
        if (busqueda.trim()) {
            const busquedaLower = busqueda.toLowerCase();
            resultado = resultado.filter(p =>
                p.nombre.toLowerCase().includes(busquedaLower)
            );
        }

        setProductosFiltrados(resultado);
    };

    const abrirNuevaMesa = async () => {
        if (!numeroMesa.trim()) {
            Alert.alert('Error', 'Ingresa el número de mesa');
            return;
        }

        try {
            setGuardando(true);

            const { data, error } = await supabase
                .from('mesas')
                .insert([{
                    tienda_id: tiendaActual?.tiendas?.id,
                    sesion_id: null, // Puedes vincular con sesión si quieres
                    numero_mesa: numeroMesa,
                    estado: 'abierta',
                    total_mesa: 0,
                    total_pagado: 0,
                    total_pendiente: 0,
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ Error abriendo mesa:', error);
                Alert.alert('Error', 'No se pudo abrir la mesa');
                return;
            }

            setModalNuevaMesaVisible(false);
            setNumeroMesa('');
            cargarMesas(); // Recargar inmediatamente
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'No se pudo abrir la mesa');
        } finally {
            setGuardando(false);
        }
    };

    const agregarCliente = async () => {
        if (!mesaSeleccionada) return;

        const nombre = nombreCliente.trim() || `Cliente ${(mesaSeleccionada.clientes?.length || 0) + 1}`;

        try {
            setGuardando(true);

            const { error } = await supabase
                .from('mesas_clientes')
                .insert([{
                    mesa_id: mesaSeleccionada.id,
                    nombre_cliente: nombre,
                    estado: 'pendiente',
                    total: 0,
                }]);

            if (error) {
                console.error('❌ Error agregando cliente:', error);
                Alert.alert('Error', 'No se pudo agregar el cliente');
                return;
            }

            setModalNuevoClienteVisible(false);
            setNombreCliente('');
            cargarMesas(); // Recargar inmediatamente
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'No se pudo agregar el cliente');
        } finally {
            setGuardando(false);
        }
    };

    const abrirModalCantidad = (producto: Producto) => {
        setProductoParaAgregar(producto);
        setCantidadProducto('1');
        setModalCantidadVisible(true);
    };

    const agregarProductoACliente = async () => {
        if (!clienteSeleccionado || !productoParaAgregar) return;

        const cantidad = parseInt(cantidadProducto) || 1;
        if (cantidad <= 0) {
            Alert.alert('Error', 'La cantidad debe ser mayor a 0');
            return;
        }

        try {
            setGuardando(true);

            const subtotal = productoParaAgregar.precio_venta * cantidad;

            // Agregar producto al detalle
            const { error: detalleError } = await supabase
                .from('mesas_clientes_detalle')
                .insert([{
                    mesa_cliente_id: clienteSeleccionado.id,
                    producto_id: productoParaAgregar.id,
                    cantidad: cantidad,
                    precio_unitario: productoParaAgregar.precio_venta,
                    subtotal: subtotal,
                }]);

            if (detalleError) {
                console.error('❌ Error agregando producto:', detalleError);
                Alert.alert('Error', 'No se pudo agregar el producto');
                return;
            }

            // Actualizar total del cliente
            const nuevoTotal = clienteSeleccionado.total + subtotal;
            await supabase
                .from('mesas_clientes')
                .update({ total: nuevoTotal })
                .eq('id', clienteSeleccionado.id);

            // Actualizar total de la mesa
            if (mesaSeleccionada) {
                const nuevoTotalMesa = mesaSeleccionada.total_mesa + subtotal;
                const nuevoTotalPendiente = mesaSeleccionada.total_pendiente + subtotal;
                await supabase
                    .from('mesas')
                    .update({
                        total_mesa: nuevoTotalMesa,
                        total_pendiente: nuevoTotalPendiente
                    })
                    .eq('id', mesaSeleccionada.id);
            }

            setModalCantidadVisible(false);
            setProductoParaAgregar(null);
            setCantidadProducto('1');

            // Recargar y actualizar estados
            await cargarMesas();

            // Actualizar mesaSeleccionada y clienteSeleccionado con los nuevos datos
            if (mesaSeleccionada) {
                const mesaActualizada = await obtenerMesaActualizada(mesaSeleccionada.id);
                if (mesaActualizada) {
                    setMesaSeleccionada(mesaActualizada);

                    // Actualizar cliente seleccionado
                    const clienteActualizado = mesaActualizada.clientes?.find(c => c.id === clienteSeleccionado.id);
                    if (clienteActualizado) {
                        setClienteSeleccionado(clienteActualizado);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'No se pudo agregar el producto');
        } finally {
            setGuardando(false);
        }
    };

    const obtenerMesaActualizada = async (mesaId: string): Promise<Mesa | null> => {
        try {
            // Cargar mesa
            const { data: mesaData, error: mesaError } = await supabase
                .from('mesas')
                .select('*')
                .eq('id', mesaId)
                .single();

            if (mesaError || !mesaData) return null;

            // Cargar clientes
            const { data: clientesData, error: clientesError } = await supabase
                .from('mesas_clientes')
                .select('*')
                .eq('mesa_id', mesaId)
                .order('created_at', { ascending: true });

            if (clientesError) return null;

            // Cargar detalles
            const clienteIds = clientesData?.map(c => c.id) || [];
            let detallesData: any[] = [];

            if (clienteIds.length > 0) {
                const { data: detallesRaw } = await supabase
                    .from('mesas_clientes_detalle')
                    .select('*')
                    .in('mesa_cliente_id', clienteIds);

                if (detallesRaw && detallesRaw.length > 0) {
                    const productoIds = detallesRaw.map(d => d.producto_id);
                    const { data: productosData } = await supabase
                        .from('productos')
                        .select('id, nombre')
                        .in('id', productoIds);

                    detallesData = detallesRaw.map(detalle => ({
                        ...detalle,
                        productos: productosData?.find(p => p.id === detalle.producto_id) || { nombre: 'Producto' }
                    }));
                }
            }

            // Combinar datos
            const clientesConProductos = clientesData?.map(cliente => ({
                ...cliente,
                productos: detallesData.filter(d => d.mesa_cliente_id === cliente.id)
            })) || [];

            return {
                ...mesaData,
                clientes: clientesConProductos
            };
        } catch (error) {
            console.error('❌ Error obteniendo mesa:', error);
            return null;
        }
    };

    const cobrarCliente = async (cliente: Cliente) => {
        if (cliente.total <= 0) {
            Alert.alert('Error', 'Este cliente no tiene productos');
            return;
        }

        Alert.alert(
            'Cobrar Cliente',
            `¿Cobrar $${cliente.total.toLocaleString('es-CO')} a ${cliente.nombre_cliente}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cobrar',
                    onPress: async () => {
                        try {
                            setGuardando(true);

                            // Actualizar estado del cliente
                            await supabase
                                .from('mesas_clientes')
                                .update({
                                    estado: 'pagado',
                                    pagado_at: new Date().toISOString()
                                })
                                .eq('id', cliente.id);

                            // Actualizar totales de la mesa
                            if (mesaSeleccionada) {
                                const nuevoTotalPagado = mesaSeleccionada.total_pagado + cliente.total;
                                const nuevoTotalPendiente = mesaSeleccionada.total_pendiente - cliente.total;
                                await supabase
                                    .from('mesas')
                                    .update({
                                        total_pagado: nuevoTotalPagado,
                                        total_pendiente: nuevoTotalPendiente
                                    })
                                    .eq('id', mesaSeleccionada.id);
                            }

                            cargarMesas(); // Recargar inmediatamente
                        } catch (error) {
                            console.error('❌ Error:', error);
                            Alert.alert('Error', 'No se pudo cobrar al cliente');
                        } finally {
                            setGuardando(false);
                        }
                    }
                }
            ]
        );
    };

    const confirmarCobro = async () => {
        if (!tipoPagoSeleccionado) {
            Alert.alert('Error', 'Selecciona un método de pago');
            return;
        }

        if (!clienteParaCobrar || !mesaSeleccionada) return;

        try {
            setGuardando(true);

            // Actualizar estado del cliente
            await supabase
                .from('mesas_clientes')
                .update({
                    estado: 'pagado',
                    tipo_pago_id: tipoPagoSeleccionado,
                    pagado_at: new Date().toISOString()
                })
                .eq('id', clienteParaCobrar.id);

            // Actualizar totales de la mesa
            const nuevoTotalPagado = mesaSeleccionada.total_pagado + clienteParaCobrar.total;
            const nuevoTotalPendiente = mesaSeleccionada.total_pendiente - clienteParaCobrar.total;
            await supabase
                .from('mesas')
                .update({
                    total_pagado: nuevoTotalPagado,
                    total_pendiente: nuevoTotalPendiente
                })
                .eq('id', mesaSeleccionada.id);

            setModalCobrarVisible(false);
            setClienteParaCobrar(null);
            setTipoPagoSeleccionado(null);

            // Recargar y actualizar estados
            await cargarMesas();
            const mesaActualizada = await obtenerMesaActualizada(mesaSeleccionada.id);
            if (mesaActualizada) {
                setMesaSeleccionada(mesaActualizada);
            }
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'No se pudo cobrar al cliente');
        } finally {
            setGuardando(false);
        }
    };

    const reabrirCuentaCliente = async (cliente: Cliente) => {
        Alert.alert(
            'Reiniciar Cuenta',
            `¿Reiniciar la cuenta de ${cliente.nombre_cliente}? La cuenta anterior ya está pagada y se creará una nueva cuenta desde $0.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Reiniciar',
                    onPress: async () => {
                        try {
                            setGuardando(true);

                            // Eliminar productos anteriores del cliente
                            await supabase
                                .from('mesas_clientes_detalle')
                                .delete()
                                .eq('mesa_cliente_id', cliente.id);

                            // Cambiar estado a pendiente y resetear total
                            await supabase
                                .from('mesas_clientes')
                                .update({
                                    estado: 'pendiente',
                                    total: 0,
                                    tipo_pago_id: null,
                                    pagado_at: null
                                })
                                .eq('id', cliente.id);

                            // NO actualizar totales de la mesa porque el cliente ya pagó
                            // La mesa mantiene el total pagado anterior

                            // Recargar y actualizar estados
                            await cargarMesas();
                            const mesaActualizada = await obtenerMesaActualizada(mesaSeleccionada.id);
                            if (mesaActualizada) {
                                setMesaSeleccionada(mesaActualizada);
                            }
                        } catch (error) {
                            console.error('❌ Error:', error);
                            Alert.alert('Error', 'No se pudo reiniciar la cuenta');
                        } finally {
                            setGuardando(false);
                        }
                    }
                }
            ]
        );
    };

    const cerrarMesa = async (mesa: Mesa) => {
        if (mesa.total_pendiente > 0) {
            Alert.alert('Error', 'Aún hay clientes con cuentas pendientes');
            return;
        }

        Alert.alert(
            'Cerrar Mesa',
            `¿Cerrar ${mesa.numero_mesa}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar',
                    onPress: async () => {
                        try {
                            setGuardando(true);

                            await supabase
                                .from('mesas')
                                .update({
                                    estado: 'cerrada',
                                    closed_at: new Date().toISOString()
                                })
                                .eq('id', mesa.id);

                            Alert.alert('Éxito', 'Mesa cerrada correctamente');
                            setModalMesaDetalleVisible(false);
                            cargarMesas();
                        } catch (error) {
                            console.error('❌ Error:', error);
                            Alert.alert('Error', 'No se pudo cerrar la mesa');
                        } finally {
                            setGuardando(false);
                        }
                    }
                }
            ]
        );
    };

    const borrarMesa = async (mesa: Mesa) => {
        Alert.alert(
            'Borrar Mesa',
            `¿Estás seguro de borrar ${mesa.numero_mesa}? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setGuardando(true);

                            // Primero borrar los detalles de los clientes
                            const clienteIds = mesa.clientes?.map(c => c.id) || [];
                            if (clienteIds.length > 0) {
                                await supabase
                                    .from('mesas_clientes_detalle')
                                    .delete()
                                    .in('mesa_cliente_id', clienteIds);

                                // Luego borrar los clientes
                                await supabase
                                    .from('mesas_clientes')
                                    .delete()
                                    .in('id', clienteIds);
                            }

                            // Finalmente borrar la mesa
                            await supabase
                                .from('mesas')
                                .delete()
                                .eq('id', mesa.id);

                            Alert.alert('Éxito', 'Mesa borrada correctamente');
                            cargarMesas();
                        } catch (error) {
                            console.error('❌ Error:', error);
                            Alert.alert('Error', 'No se pudo borrar la mesa');
                        } finally {
                            setGuardando(false);
                        }
                    }
                }
            ]
        );
    };

    const renderRightActions = (mesa: Mesa) => {
        return (
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => borrarMesa(mesa)}
            >
                <Text style={styles.deleteButtonText}>🗑️</Text>
                <Text style={styles.deleteButtonLabel}>Borrar</Text>
            </TouchableOpacity>
        );
    };

    const verDetalleMesa = (mesa: Mesa) => {
        setMesaSeleccionada(mesa);
        setModalMesaDetalleVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Cargando mesas...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>🍺 Mesas</Text>
                    <Text style={styles.subtitle}>
                        {mesas.length} mesas activas
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalNuevaMesaVisible(true)}
                >
                    <Text style={styles.addButtonText}>➕ Nueva Mesa</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {mesas.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🍺</Text>
                        <Text style={styles.emptyTitle}>No hay mesas activas</Text>
                        <Text style={styles.emptyText}>
                            Abre una nueva mesa para comenzar
                        </Text>
                    </View>
                ) : (
                    mesas.map((mesa) => (
                        <Swipeable
                            key={mesa.id}
                            renderRightActions={() => renderRightActions(mesa)}
                            overshootRight={false}
                        >
                            <TouchableOpacity
                                style={styles.mesaCard}
                                onPress={() => verDetalleMesa(mesa)}
                            >
                                <View style={styles.mesaHeader}>
                                    <Text style={styles.mesaNumero}>{mesa.numero_mesa}</Text>
                                    <Text style={styles.mesaTotal}>
                                        ${mesa.total_mesa.toLocaleString('es-CO')}
                                    </Text>
                                </View>
                                <View style={styles.mesaInfo}>
                                    <Text style={styles.mesaClientes}>
                                        👥 {mesa.clientes?.length || 0} clientes
                                    </Text>
                                    <View style={styles.mesaEstados}>
                                        <Text style={styles.mesaPendiente}>
                                            ⏳ ${mesa.total_pendiente.toLocaleString('es-CO')}
                                        </Text>
                                        <Text style={styles.mesaPagado}>
                                            ✓ ${mesa.total_pagado.toLocaleString('es-CO')}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    ))
                )}
            </ScrollView>

            {/* Modal Nueva Mesa */}
            <Modal
                visible={modalNuevaMesaVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalNuevaMesaVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>➕ Nueva Mesa</Text>
                            <TouchableOpacity
                                onPress={() => setModalNuevaMesaVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            <Text style={styles.formLabel}>Número de Mesa</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Ej: Mesa 1, Mesa VIP, etc."
                                value={numeroMesa}
                                onChangeText={setNumeroMesa}
                                placeholderTextColor="#9CA3AF"
                                autoFocus
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, guardando && styles.submitButtonDisabled]}
                                onPress={abrirNuevaMesa}
                                disabled={guardando}
                            >
                                <Text style={styles.submitButtonText}>
                                    {guardando ? 'Abriendo...' : '✓ Abrir Mesa'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Detalle de Mesa */}
            <Modal
                visible={modalMesaDetalleVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalMesaDetalleVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerLarge}>
                        {mesaSeleccionada && (
                            <>
                                <View style={styles.modalHeader}>
                                    <View>
                                        <Text style={styles.modalTitle}>{mesaSeleccionada.numero_mesa}</Text>
                                        <Text style={styles.modalSubtitle}>
                                            Total: ${mesaSeleccionada.total_mesa.toLocaleString('es-CO')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setModalMesaDetalleVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalContent}>
                                    {/* Resumen */}
                                    <View style={styles.resumenMesa}>
                                        <View style={styles.resumenItem}>
                                            <Text style={styles.resumenLabel}>Pendiente</Text>
                                            <Text style={styles.resumenValuePendiente}>
                                                ${mesaSeleccionada.total_pendiente.toLocaleString('es-CO')}
                                            </Text>
                                        </View>
                                        <View style={styles.resumenItem}>
                                            <Text style={styles.resumenLabel}>Pagado</Text>
                                            <Text style={styles.resumenValuePagado}>
                                                ${mesaSeleccionada.total_pagado.toLocaleString('es-CO')}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Lista de Clientes */}
                                    <Text style={styles.sectionTitle}>👥 Clientes</Text>
                                    {mesaSeleccionada.clientes?.map((cliente) => (
                                        <View key={cliente.id} style={styles.clienteCard}>
                                            <View style={styles.clienteHeader}>
                                                <Text style={styles.clienteNombre}>{cliente.nombre_cliente}</Text>
                                                <View style={[
                                                    styles.clienteEstadoBadge,
                                                    cliente.estado === 'pagado' ? styles.clienteEstadoPagado : styles.clienteEstadoPendiente
                                                ]}>
                                                    <Text style={styles.clienteEstadoText}>
                                                        {cliente.estado === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Productos del cliente */}
                                            {cliente.productos?.map((prod) => (
                                                <View key={prod.id} style={styles.productoItem}>
                                                    <Text style={styles.productoNombre}>
                                                        {prod.cantidad}x {prod.productos.nombre}
                                                    </Text>
                                                    <Text style={styles.productoSubtotal}>
                                                        ${prod.subtotal.toLocaleString('es-CO')}
                                                    </Text>
                                                </View>
                                            ))}

                                            <View style={styles.clienteFooter}>
                                                <Text style={styles.clienteTotal}>
                                                    Total: ${cliente.total.toLocaleString('es-CO')}
                                                </Text>
                                                <View style={styles.clienteActions}>
                                                    {cliente.estado === 'pendiente' && (
                                                        <>
                                                            <TouchableOpacity
                                                                style={styles.clienteActionButton}
                                                                onPress={() => {
                                                                    setClienteSeleccionado(cliente);
                                                                    setModalAgregarProductoVisible(true);
                                                                }}
                                                            >
                                                                <Text style={styles.clienteActionText}>➕</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={styles.clienteCobrarButton}
                                                                onPress={() => cobrarCliente(cliente)}
                                                            >
                                                                <Text style={styles.clienteCobrarText}>💳 Cobrar</Text>
                                                            </TouchableOpacity>
                                                        </>
                                                    )}
                                                    {cliente.estado === 'pagado' && (
                                                        <TouchableOpacity
                                                            style={styles.clienteReabrirButton}
                                                            onPress={() => reabrirCuentaCliente(cliente)}
                                                        >
                                                            <Text style={styles.clienteReabrirText}>🔄 Reabrir</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    ))}

                                    {/* Botones de acción */}
                                    <TouchableOpacity
                                        style={styles.addClienteButton}
                                        onPress={() => setModalNuevoClienteVisible(true)}
                                    >
                                        <Text style={styles.addClienteButtonText}>➕ Agregar Cliente</Text>
                                    </TouchableOpacity>

                                    {mesaSeleccionada.total_pendiente === 0 && mesaSeleccionada.total_mesa > 0 && (
                                        <TouchableOpacity
                                            style={styles.cerrarMesaButton}
                                            onPress={() => cerrarMesa(mesaSeleccionada)}
                                        >
                                            <Text style={styles.cerrarMesaButtonText}>🔒 Cerrar Mesa</Text>
                                        </TouchableOpacity>
                                    )}

                                    <View style={styles.bottomMargin} />
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal Nuevo Cliente */}
            <Modal
                visible={modalNuevoClienteVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalNuevoClienteVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>➕ Nuevo Cliente</Text>
                            <TouchableOpacity
                                onPress={() => setModalNuevoClienteVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            <Text style={styles.formLabel}>Nombre (opcional)</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Ej: Juan, María, etc."
                                value={nombreCliente}
                                onChangeText={setNombreCliente}
                                placeholderTextColor="#9CA3AF"
                                autoFocus
                            />
                            <Text style={styles.formHint}>
                                Si no ingresas nombre, se asignará automáticamente
                            </Text>

                            <TouchableOpacity
                                style={[styles.submitButton, guardando && styles.submitButtonDisabled]}
                                onPress={agregarCliente}
                                disabled={guardando}
                            >
                                <Text style={styles.submitButtonText}>
                                    {guardando ? 'Agregando...' : '✓ Agregar Cliente'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Agregar Producto */}
            <Modal
                visible={modalAgregarProductoVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setModalAgregarProductoVisible(false);
                    setBusqueda('');
                    setCategoriaSeleccionada(null);
                    setProductosFiltrados([]);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerLarge}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                ➕ Agregar a {clienteSeleccionado?.nombre_cliente}
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalAgregarProductoVisible(false);
                                    setBusqueda('');
                                    setCategoriaSeleccionada(null);
                                    setProductosFiltrados([]);
                                }}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            {/* Categorías */}
                            {!categoriaSeleccionada && !busqueda && (
                                <>
                                    <Text style={styles.sectionTitle}>Categorías</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriasScroll}>
                                        {categorias.map((categoria) => (
                                            <TouchableOpacity
                                                key={categoria.id}
                                                style={styles.categoriaChip}
                                                onPress={() => setCategoriaSeleccionada(categoria.id)}
                                            >
                                                <Text style={styles.categoriaIcon}>{categoria.icono}</Text>
                                                <Text style={styles.categoriaText}>{categoria.nombre}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            {/* Búsqueda */}
                            <TextInput
                                style={styles.searchInput}
                                placeholder="O buscar producto..."
                                value={busqueda}
                                onChangeText={setBusqueda}
                                placeholderTextColor="#9CA3AF"
                            />

                            {/* Botón volver si hay categoría seleccionada */}
                            {categoriaSeleccionada && !busqueda && (
                                <TouchableOpacity
                                    style={styles.volverButton}
                                    onPress={() => {
                                        setCategoriaSeleccionada(null);
                                        setProductosFiltrados([]);
                                    }}
                                >
                                    <Text style={styles.volverButtonText}>← Volver a categorías</Text>
                                </TouchableOpacity>
                            )}

                            {/* Lista de productos */}
                            <ScrollView style={styles.productosList}>
                                {productosFiltrados.length > 0 ? (
                                    productosFiltrados.map((producto) => (
                                        <TouchableOpacity
                                            key={producto.id}
                                            style={styles.productoSearchItem}
                                            onPress={() => abrirModalCantidad(producto)}
                                        >
                                            <View>
                                                <Text style={styles.productoSearchNombre}>{producto.nombre}</Text>
                                                <Text style={styles.productoSearchStock}>
                                                    Stock: {producto.stock_actual}
                                                </Text>
                                            </View>
                                            <Text style={styles.productoSearchPrecio}>
                                                ${producto.precio_venta.toLocaleString('es-CO')}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (categoriaSeleccionada || busqueda) ? (
                                    <View style={styles.emptyProductos}>
                                        <Text style={styles.emptyProductosText}>No hay productos</Text>
                                    </View>
                                ) : null}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Cantidad */}
            <Modal
                visible={modalCantidadVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalCantidadVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cantidad</Text>
                            <TouchableOpacity
                                onPress={() => setModalCantidadVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            {productoParaAgregar && (
                                <>
                                    <Text style={styles.productoNombreCantidad}>
                                        {productoParaAgregar.nombre}
                                    </Text>
                                    <Text style={styles.productoPrecioCantidad}>
                                        ${productoParaAgregar.precio_venta.toLocaleString('es-CO')} c/u
                                    </Text>

                                    <View style={styles.cantidadContainer}>
                                        <TouchableOpacity
                                            style={styles.cantidadButton}
                                            onPress={() => {
                                                const cantidad = parseInt(cantidadProducto) || 1;
                                                if (cantidad > 1) setCantidadProducto((cantidad - 1).toString());
                                            }}
                                        >
                                            <Text style={styles.cantidadButtonText}>−</Text>
                                        </TouchableOpacity>

                                        <TextInput
                                            style={styles.cantidadInput}
                                            value={cantidadProducto}
                                            onChangeText={setCantidadProducto}
                                            keyboardType="numeric"
                                            selectTextOnFocus
                                        />

                                        <TouchableOpacity
                                            style={styles.cantidadButton}
                                            onPress={() => {
                                                const cantidad = parseInt(cantidadProducto) || 0;
                                                setCantidadProducto((cantidad + 1).toString());
                                            }}
                                        >
                                            <Text style={styles.cantidadButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.totalCantidad}>
                                        Total: ${((parseInt(cantidadProducto) || 0) * productoParaAgregar.precio_venta).toLocaleString('es-CO')}
                                    </Text>

                                    <TouchableOpacity
                                        style={[styles.submitButton, guardando && styles.submitButtonDisabled]}
                                        onPress={agregarProductoACliente}
                                        disabled={guardando}
                                    >
                                        <Text style={styles.submitButtonText}>
                                            {guardando ? 'Agregando...' : '✓ Agregar'}
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal Cobrar */}
            <Modal
                visible={modalCobrarVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setModalCobrarVisible(false);
                    setTipoPagoSeleccionado(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerLarge}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>💳 Cobrar</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalCobrarVisible(false);
                                    setTipoPagoSeleccionado(null);
                                }}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {clienteParaCobrar && (
                                <>
                                    {/* Información del cliente */}
                                    <Text style={styles.cobrarClienteNombre}>
                                        {clienteParaCobrar.nombre_cliente}
                                    </Text>

                                    {/* Detalle de productos */}
                                    <Text style={styles.sectionTitle}>Detalle de la Cuenta</Text>
                                    <View style={styles.detalleProductos}>
                                        {clienteParaCobrar.productos?.map((prod) => (
                                            <View key={prod.id} style={styles.detalleProductoItem}>
                                                <View style={styles.detalleProductoInfo}>
                                                    <Text style={styles.detalleProductoNombre}>
                                                        {prod.cantidad}x {prod.productos.nombre}
                                                    </Text>
                                                    <Text style={styles.detalleProductoPrecio}>
                                                        ${prod.precio_unitario.toLocaleString('es-CO')} c/u
                                                    </Text>
                                                </View>
                                                <Text style={styles.detalleProductoSubtotal}>
                                                    ${prod.subtotal.toLocaleString('es-CO')}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Total */}
                                    <View style={styles.cobrarTotalContainer}>
                                        <Text style={styles.cobrarTotalLabel}>Total a Pagar:</Text>
                                        <Text style={styles.cobrarTotal}>
                                            ${clienteParaCobrar.total.toLocaleString('es-CO')}
                                        </Text>
                                    </View>

                                    {/* Métodos de pago */}
                                    <Text style={styles.sectionTitle}>Método de Pago</Text>
                                    <View style={styles.tiposPagoGrid}>
                                        {tiposPago.map((tipo) => (
                                            <TouchableOpacity
                                                key={tipo.id}
                                                style={[
                                                    styles.tipoPagoChip,
                                                    tipoPagoSeleccionado === tipo.id && styles.tipoPagoChipSelected
                                                ]}
                                                onPress={() => setTipoPagoSeleccionado(tipo.id)}
                                            >
                                                <Text style={styles.tipoPagoChipIcono}>{tipo.icono}</Text>
                                                <Text style={[
                                                    styles.tipoPagoChipNombre,
                                                    tipoPagoSeleccionado === tipo.id && styles.tipoPagoChipNombreSelected
                                                ]}>
                                                    {tipo.nombre}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Botón confirmar */}
                                    <TouchableOpacity
                                        style={[
                                            styles.confirmarCobroButton,
                                            (!tipoPagoSeleccionado || guardando) && styles.confirmarCobroButtonDisabled
                                        ]}
                                        onPress={confirmarCobro}
                                        disabled={!tipoPagoSeleccionado || guardando}
                                    >
                                        <Text style={styles.confirmarCobroButtonText}>
                                            {guardando ? 'Procesando...' : '✓ Confirmar Pago'}
                                        </Text>
                                    </TouchableOpacity>

                                    <View style={styles.bottomMargin} />
                                </>
                            )}
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
    deleteButton: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        marginBottom: 12,
        borderRadius: 12,
    },
    deleteButtonText: {
        fontSize: 24,
        marginBottom: 4,
    },
    deleteButtonLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
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
    addButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    mesaCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    mesaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mesaNumero: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    mesaTotal: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
    },
    mesaInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mesaClientes: {
        fontSize: 14,
        color: '#6B7280',
    },
    mesaEstados: {
        flexDirection: 'row',
        gap: 12,
    },
    mesaPendiente: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '600',
    },
    mesaPagado: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
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
        maxHeight: '90%',
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
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
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
        height: 48,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    formHint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    resumenMesa: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    resumenItem: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    resumenLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    resumenValuePendiente: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F59E0B',
    },
    resumenValuePagado: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#10B981',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    clienteCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    clienteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    clienteNombre: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    clienteEstadoBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    clienteEstadoPendiente: {
        backgroundColor: '#FEF3C7',
    },
    clienteEstadoPagado: {
        backgroundColor: '#D1FAE5',
    },
    clienteEstadoText: {
        fontSize: 11,
        fontWeight: '600',
    },
    productoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    productoNombre: {
        fontSize: 13,
        color: '#6B7280',
    },
    productoSubtotal: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
    },
    clienteFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    clienteTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    clienteActions: {
        flexDirection: 'row',
        gap: 8,
    },
    clienteActionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clienteActionText: {
        fontSize: 16,
        color: '#fff',
    },
    clienteCobrarButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    clienteCobrarText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    clienteReabrirButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    clienteReabrirText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    addClienteButton: {
        backgroundColor: '#EFF6FF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 2,
        borderColor: '#3B82F6',
        borderStyle: 'dashed',
    },
    addClienteButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    cerrarMesaButton: {
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    cerrarMesaButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
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
        marginBottom: 16,
    },
    productosList: {
        maxHeight: 400,
    },
    productoSearchItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 8,
    },
    productoSearchNombre: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    productoSearchStock: {
        fontSize: 12,
        color: '#6B7280',
    },
    productoSearchPrecio: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    bottomMargin: {
        height: 40,
    },
    categoriasScroll: {
        marginBottom: 16,
    },
    categoriaChip: {
        backgroundColor: '#10B981',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        minWidth: 100,
    },
    categoriaIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    categoriaText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    volverButton: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    volverButtonText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    emptyProductos: {
        padding: 40,
        alignItems: 'center',
    },
    emptyProductosText: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    productoNombreCantidad: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    productoPrecioCantidad: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
        textAlign: 'center',
    },
    cantidadContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    cantidadButton: {
        width: 50,
        height: 50,
        backgroundColor: '#10B981',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cantidadButtonText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    },
    cantidadInput: {
        width: 80,
        height: 50,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        marginHorizontal: 16,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1F2937',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    totalCantidad: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
        textAlign: 'center',
        marginBottom: 24,
    },
    cobrarClienteNombre: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 20,
    },
    detalleProductos: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    detalleProductoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    detalleProductoInfo: {
        flex: 1,
    },
    detalleProductoNombre: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    detalleProductoPrecio: {
        fontSize: 12,
        color: '#6B7280',
    },
    detalleProductoSubtotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    cobrarTotalContainer: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    cobrarTotalLabel: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 4,
    },
    cobrarTotal: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    tiposPagoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    tipoPagoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        minWidth: '45%',
    },
    tipoPagoChipSelected: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    tipoPagoChipIcono: {
        fontSize: 20,
        marginRight: 8,
    },
    tipoPagoChipNombre: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    tipoPagoChipNombreSelected: {
        color: '#10B981',
    },
    confirmarCobroButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmarCobroButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.5,
    },
    confirmarCobroButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    tiposPagoList: {
        maxHeight: 300,
    },
    tipoPagoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tipoPagoIcono: {
        fontSize: 24,
        marginRight: 12,
    },
    tipoPagoNombre: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
});
