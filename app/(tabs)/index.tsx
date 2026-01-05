import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList, TextInput, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

type DashboardStats = {
    ventasHoy: number;
    totalProductos: number;
    stockBajo: number;
    gastosDelMes: number;
    porcentajeVentas: number;
    porcentajeInventario: number;
    porcentajeGastos: number;
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

type VentaReciente = {
    id: string;
    producto: string;
    fecha: string;
    total: number;
    cantidad: number;
};

type Categoria = {
    id: string;
    nombre: string;
};

export default function DashboardScreen() {
    const { usuario, tiendaActual } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        ventasHoy: 0,
        totalProductos: 0,
        stockBajo: 0,
        gastosDelMes: 0,
        porcentajeVentas: 0,
        porcentajeInventario: 0,
        porcentajeGastos: 0,
    });
    const [loading, setLoading] = useState(true);
    const [modalProductosVisible, setModalProductosVisible] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [ventasRecientes, setVentasRecientes] = useState<VentaReciente[]>([]);
    const [modalAgregarProductoVisible, setModalAgregarProductoVisible] = useState(false);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [nuevoProducto, setNuevoProducto] = useState({
        nombre: '',
        categoria_id: '',
        precio_compra: '',
        precio_venta: '',
        stock_actual: '',
        stock_minimo: '5',
        stock_maximo: '100',
        sku: '',
        codigo_barras: '',
    });
    const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);

    useEffect(() => {
        if (tiendaActual?.tiendas?.id) {
            cargarEstadisticas();
            cargarVentasRecientes();
            cargarCategorias();
        }
    }, [tiendaActual]);

    const cargarVentasRecientes = async () => {
        try {
            const tiendaId = tiendaActual?.tiendas?.id;
            if (!tiendaId) return;

            const { data, error } = await supabase
                .from('ventas')
                .select(`
                    id,
                    total,
                    created_at,
                    ventas_detalle (
                        cantidad,
                        productos (
                            nombre
                        )
                    )
                `)
                .eq('tienda_id', tiendaId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error('❌ Error cargando ventas recientes:', error);
                return;
            }

            const ventasFormateadas = data?.map(venta => ({
                id: venta.id,
                producto: venta.ventas_detalle?.[0]?.productos?.nombre || 'Producto',
                fecha: new Date(venta.created_at).toLocaleDateString('es-CO'),
                total: venta.total,
                cantidad: venta.ventas_detalle?.reduce((sum, d) => sum + d.cantidad, 0) || 0,
            })) || [];

            setVentasRecientes(ventasFormateadas);
        } catch (error) {
            console.error('❌ Error cargando ventas recientes:', error);
        }
    };

    const cargarCategorias = async () => {
        try {
            const tiendaId = tiendaActual?.tiendas?.id;
            if (!tiendaId) return;

            const { data, error } = await supabase
                .from('categorias')
                .select('id, nombre')
                .eq('tienda_id', tiendaId)
                .eq('activa', true)
                .order('nombre', { ascending: true });

            if (error) {
                console.error('❌ Error cargando categorías:', error);
                return;
            }

            setCategorias(data || []);
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
        }
    };

    const seleccionarImagen = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                alert('Necesitamos acceso a la galería para seleccionar imágenes');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                setImagenSeleccionada(result.assets[0].uri);
            }
        } catch (error) {
            console.error('❌ Error seleccionando imagen:', error);
            alert('Error al seleccionar la imagen');
        }
    };

    const tomarFoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                alert('Necesitamos acceso a la cámara para tomar fotos');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                setImagenSeleccionada(result.assets[0].uri);
            }
        } catch (error) {
            console.error('❌ Error tomando foto:', error);
            alert('Error al tomar la foto');
        }
    };

    const subirImagen = async (productoId: string) => {
        if (!imagenSeleccionada) return null;

        try {
            const ext = imagenSeleccionada.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${productoId}-${Date.now()}.${ext}`;
            const filePath = `${tiendaActual?.tiendas?.id}/${fileName}`;

            const response = await fetch(imagenSeleccionada);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('productos')
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${ext}`,
                    upsert: true
                });

            if (uploadError) {
                console.error('❌ Error subiendo imagen:', uploadError);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('productos')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('❌ Error:', error);
            return null;
        }
    };

    const agregarProducto = async () => {
        // Validaciones
        if (!nuevoProducto.nombre.trim()) {
            alert('El nombre del producto es obligatorio');
            return;
        }

        if (!nuevoProducto.categoria_id) {
            alert('Debes seleccionar una categoría');
            return;
        }

        const precioCompra = parseFloat(nuevoProducto.precio_compra);
        const precioVenta = parseFloat(nuevoProducto.precio_venta);
        const stockActual = parseInt(nuevoProducto.stock_actual);
        const stockMinimo = parseInt(nuevoProducto.stock_minimo);
        const stockMaximo = parseInt(nuevoProducto.stock_maximo);

        if (isNaN(precioCompra) || precioCompra < 0) {
            alert('El precio de compra debe ser un número válido');
            return;
        }

        if (isNaN(precioVenta) || precioVenta <= 0) {
            alert('El precio de venta debe ser mayor a 0');
            return;
        }

        if (isNaN(stockActual) || stockActual < 0) {
            alert('El stock actual debe ser un número válido');
            return;
        }

        if (isNaN(stockMinimo) || stockMinimo < 0) {
            alert('El stock mínimo debe ser un número válido');
            return;
        }

        if (isNaN(stockMaximo) || stockMaximo <= 0) {
            alert('El stock máximo debe ser mayor a 0');
            return;
        }

        try {
            setGuardando(true);

            const margen = ((precioVenta - precioCompra) / precioCompra * 100);

            const productoData = {
                tienda_id: tiendaActual?.tiendas?.id,
                nombre: nuevoProducto.nombre.trim(),
                categoria_id: nuevoProducto.categoria_id,
                precio_compra: precioCompra,
                precio_venta: precioVenta,
                margen_ganancia: margen,
                stock_actual: stockActual,
                stock_minimo: stockMinimo,
                stock_maximo: stockMaximo,
                sku: nuevoProducto.sku.trim() || null,
                codigo_barras: nuevoProducto.codigo_barras.trim() || null,
                activo: true,
            };

            const { data, error } = await supabase
                .from('productos')
                .insert([productoData])
                .select('id')
                .single();

            if (error) {
                console.error('❌ Error agregando producto:', error);
                alert('Error al agregar el producto');
                return;
            }

            // Subir imagen si fue seleccionada
            if (imagenSeleccionada && data?.id) {
                const imagenUrl = await subirImagen(data.id);
                if (imagenUrl) {
                    await supabase
                        .from('productos')
                        .update({ imagen_url: imagenUrl })
                        .eq('id', data.id);
                }
            }

            // Limpiar formulario
            setNuevoProducto({
                nombre: '',
                categoria_id: '',
                precio_compra: '',
                precio_venta: '',
                stock_actual: '',
                stock_minimo: '5',
                stock_maximo: '100',
                sku: '',
                codigo_barras: '',
            });
            setImagenSeleccionada(null);

            setModalAgregarProductoVisible(false);
            alert('Producto agregado correctamente');

            // Recargar estadísticas
            cargarEstadisticas();
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Error al agregar el producto');
        } finally {
            setGuardando(false);
        }
    };

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

            // Ventas de ayer para calcular porcentaje
            const ayer = new Date(hoy);
            ayer.setDate(ayer.getDate() - 1);
            const { data: ventasAyer } = await supabase
                .from('ventas')
                .select('total')
                .eq('tienda_id', tiendaId)
                .gte('created_at', ayer.toISOString())
                .lt('created_at', hoy.toISOString());

            const totalVentasAyer = ventasAyer?.reduce((sum, venta) => sum + Number(venta.total), 0) || 1;
            const porcentajeVentas = totalVentasAyer > 0
                ? ((totalVentasHoy - totalVentasAyer) / totalVentasAyer) * 100
                : 0;

            // 2. Total de productos
            const { count: totalProductos, error: productosError } = await supabase
                .from('productos')
                .select('*', { count: 'exact', head: true })
                .eq('tienda_id', tiendaId)
                .eq('activo', true);

            if (productosError) {
                console.error('❌ Error contando productos:', productosError);
            }

            // Valor total del inventario
            const { data: inventarioData } = await supabase
                .from('productos')
                .select('stock_actual, precio_venta')
                .eq('tienda_id', tiendaId)
                .eq('activo', true);

            const valorInventario = inventarioData?.reduce(
                (sum, p) => sum + (p.stock_actual * p.precio_venta), 0
            ) || 0;

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

            // 4. Gastos del mes
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const { data: gastosData } = await supabase
                .from('gastos')
                .select('monto')
                .eq('tienda_id', tiendaId)
                .gte('fecha_gasto', inicioMes.toISOString().split('T')[0]);

            const totalGastosMes = gastosData?.reduce((sum, g) => sum + Number(g.monto), 0) || 0;

            // Gastos del mes anterior para porcentaje
            const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
            const { data: gastosMesAnterior } = await supabase
                .from('gastos')
                .select('monto')
                .eq('tienda_id', tiendaId)
                .gte('fecha_gasto', inicioMesAnterior.toISOString().split('T')[0])
                .lte('fecha_gasto', finMesAnterior.toISOString().split('T')[0]);

            const totalGastosMesAnterior = gastosMesAnterior?.reduce((sum, g) => sum + Number(g.monto), 0) || 1;
            const porcentajeGastos = totalGastosMesAnterior > 0
                ? ((totalGastosMes - totalGastosMesAnterior) / totalGastosMesAnterior) * 100
                : 0;

            setStats({
                ventasHoy: totalVentasHoy,
                totalProductos: totalProductos || 0,
                stockBajo: productosStockBajo,
                gastosDelMes: totalGastosMes,
                porcentajeVentas: Math.round(porcentajeVentas * 10) / 10,
                porcentajeInventario: 5.2, // Simulado
                porcentajeGastos: Math.round(porcentajeGastos * 10) / 10,
            });

            console.log('✅ Estadísticas cargadas:', {
                ventasHoy: totalVentasHoy,
                totalProductos,
                stockBajo: productosStockBajo,
                gastosDelMes: totalGastosMes,
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

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => setModalAgregarProductoVisible(true)}
                    >
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

            {/* Modal de Agregar Producto */}
            <Modal
                visible={modalAgregarProductoVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalAgregarProductoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerLarge}>
                        {/* Header del Modal */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>➕ Agregar Producto</Text>
                            <TouchableOpacity
                                onPress={() => setModalAgregarProductoVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Imagen del producto */}
                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>Imagen del producto (opcional)</Text>
                                <View style={styles.imageSection}>
                                    {imagenSeleccionada ? (
                                        <View style={styles.imagePreviewContainer}>
                                            <Image
                                                source={{ uri: imagenSeleccionada }}
                                                style={styles.imagePreview}
                                                resizeMode="cover"
                                            />
                                            <TouchableOpacity
                                                style={styles.removeImageButton}
                                                onPress={() => setImagenSeleccionada(null)}
                                            >
                                                <Text style={styles.removeImageText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Text style={styles.imagePlaceholderIcon}>📷</Text>
                                            <Text style={styles.imagePlaceholderText}>Sin imagen</Text>
                                        </View>
                                    )}
                                    <View style={styles.imageButtons}>
                                        <TouchableOpacity
                                            style={styles.imageButton}
                                            onPress={tomarFoto}
                                        >
                                            <Text style={styles.imageButtonText}>📷 Tomar foto</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.imageButton}
                                            onPress={seleccionarImagen}
                                        >
                                            <Text style={styles.imageButtonText}>🖼️ Galería</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Nombre */}
                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>Nombre del producto *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Ej: Coca-Cola 400ml"
                                    value={nuevoProducto.nombre}
                                    onChangeText={(text) => setNuevoProducto({ ...nuevoProducto, nombre: text })}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* Categoría */}
                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>Categoría *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
                                    {categorias.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categorySelectorChip,
                                                nuevoProducto.categoria_id === cat.id && styles.categorySelectorChipActive
                                            ]}
                                            onPress={() => setNuevoProducto({ ...nuevoProducto, categoria_id: cat.id })}
                                        >
                                            <Text style={[
                                                styles.categorySelectorText,
                                                nuevoProducto.categoria_id === cat.id && styles.categorySelectorTextActive
                                            ]}>
                                                {cat.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Precios */}
                            <View style={styles.formRow}>
                                <View style={styles.formColumn}>
                                    <Text style={styles.formLabel}>Precio Compra *</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={nuevoProducto.precio_compra}
                                        onChangeText={(text) => setNuevoProducto({ ...nuevoProducto, precio_compra: text })}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                                <View style={styles.formColumn}>
                                    <Text style={styles.formLabel}>Precio Venta *</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={nuevoProducto.precio_venta}
                                        onChangeText={(text) => setNuevoProducto({ ...nuevoProducto, precio_venta: text })}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            {/* Stock */}
                            <View style={styles.formRow}>
                                <View style={styles.formColumn}>
                                    <Text style={styles.formLabel}>Stock Inicial *</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={nuevoProducto.stock_actual}
                                        onChangeText={(text) => setNuevoProducto({ ...nuevoProducto, stock_actual: text })}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                                <View style={styles.formColumn}>
                                    <Text style={styles.formLabel}>Stock Mínimo</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="5"
                                        keyboardType="numeric"
                                        value={nuevoProducto.stock_minimo}
                                        onChangeText={(text) => setNuevoProducto({ ...nuevoProducto, stock_minimo: text })}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>Stock Máximo</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="100"
                                    keyboardType="numeric"
                                    value={nuevoProducto.stock_maximo}
                                    onChangeText={(text) => setNuevoProducto({ ...nuevoProducto, stock_maximo: text })}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* Códigos */}
                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>SKU (opcional)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Ej: CC-400"
                                    value={nuevoProducto.sku}
                                    onChangeText={(text) => setNuevoProducto({ ...nuevoProducto, sku: text })}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.formLabel}>Código de Barras (opcional)</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Ej: 7702001234567"
                                    keyboardType="numeric"
                                    value={nuevoProducto.codigo_barras}
                                    onChangeText={(text) => setNuevoProducto({ ...nuevoProducto, codigo_barras: text })}
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* Botones */}
                            <View style={styles.formButtons}>
                                <TouchableOpacity
                                    style={[styles.formButton, styles.formButtonCancel]}
                                    onPress={() => setModalAgregarProductoVisible(false)}
                                    disabled={guardando}
                                >
                                    <Text style={styles.formButtonTextCancel}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.formButton, styles.formButtonSave]}
                                    onPress={agregarProducto}
                                    disabled={guardando}
                                >
                                    <Text style={styles.formButtonTextSave}>
                                        {guardando ? 'Guardando...' : '💾 Guardar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.bottomMargin} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

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
    modalContainerLarge: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalContent: {
        padding: 20,
    },
    formSection: {
        marginBottom: 20,
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
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    formColumn: {
        flex: 1,
    },
    categorySelector: {
        flexDirection: 'row',
    },
    categorySelectorChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categorySelectorChipActive: {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
    },
    categorySelectorText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    categorySelectorTextActive: {
        color: '#10B981',
        fontWeight: '700',
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    formButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formButtonCancel: {
        backgroundColor: '#F3F4F6',
    },
    formButtonSave: {
        backgroundColor: '#10B981',
    },
    formButtonTextCancel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    formButtonTextSave: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    bottomMargin: {
        height: 40,
    },
    imageSection: {
        alignItems: 'center',
    },
    imagePreviewContainer: {
        width: 120,
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        marginBottom: 12,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    imagePlaceholderIcon: {
        fontSize: 40,
        marginBottom: 4,
    },
    imagePlaceholderText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    imageButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    imageButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    imageButtonText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '600',
    },
});
