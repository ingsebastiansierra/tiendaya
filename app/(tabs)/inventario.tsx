import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Alert, Image, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

type Producto = {
    id: string;
    nombre: string;
    precio_venta: number;
    precio_compra: number;
    stock_actual: number;
    stock_minimo: number;
    stock_maximo: number;
    codigo_barras?: string;
    sku?: string;
    imagen_url?: string;
    categorias?: {
        id: string;
        nombre: string;
        icono?: string;
    };
};

type Categoria = {
    id: string;
    nombre: string;
};

export default function InventarioScreen() {
    const { tiendaActual } = useAuth();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');
    const [modalFiltrosVisible, setModalFiltrosVisible] = useState(false);
    const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [cantidadAjuste, setCantidadAjuste] = useState('');
    const [tipoAjuste, setTipoAjuste] = useState<'sumar' | 'restar'>('sumar');
    const [stockEditado, setStockEditado] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [modoEdicionPrecios, setModoEdicionPrecios] = useState(false);
    const [precioCompraEditado, setPrecioCompraEditado] = useState('');
    const [precioVentaEditado, setPrecioVentaEditado] = useState('');
    const [guardando, setGuardando] = useState(false);

    // Estados para agregar producto
    const [modalAgregarVisible, setModalAgregarVisible] = useState(false);
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

    // Obtener rol del usuario
    const rolUsuario = tiendaActual?.rol || '';
    const esAdmin = rolUsuario === 'admin_general' || rolUsuario === 'dueño_local';

    useEffect(() => {
        if (tiendaActual?.tiendas?.id) {
            cargarDatos();
        }
    }, [tiendaActual]);

    useEffect(() => {
        filtrarProductos();
    }, [busqueda, categoriaSeleccionada, productos]);

    // Escuchar evento global para abrir modal
    useEffect(() => {
        global.abrirModalAgregarProducto = () => {
            if (esAdmin) {
                setModalAgregarVisible(true);
            }
        };

        return () => {
            delete global.abrirModalAgregarProducto;
        };
    }, [esAdmin]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const tiendaId = tiendaActual?.tiendas?.id;

            if (!tiendaId) return;

            // Cargar productos
            const { data: productosData, error: productosError } = await supabase
                .from('productos')
                .select(`
                    id,
                    nombre,
                    precio_venta,
                    precio_compra,
                    stock_actual,
                    stock_minimo,
                    stock_maximo,
                    codigo_barras,
                    sku,
                    imagen_url,
                    categorias:categoria_id (
                        id,
                        nombre,
                        icono
                    )
                `)
                .eq('tienda_id', tiendaId)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (productosError) {
                console.error('❌ Error cargando productos:', productosError);
            } else {
                setProductos(productosData || []);
            }

            // Cargar categorías
            console.log('🔍 Cargando categorías para tienda:', tiendaId);
            const { data: categoriasData, error: categoriasError } = await supabase
                .from('categorias')
                .select('id, nombre')
                .eq('tienda_id', tiendaId)
                .eq('activa', true)
                .order('nombre', { ascending: true });

            if (categoriasError) {
                console.error('❌ Error cargando categorías:', categoriasError);
                console.error('❌ Detalles del error:', JSON.stringify(categoriasError, null, 2));
            } else {
                console.log('✅ Categorías cargadas:', categoriasData?.length || 0);
                if (categoriasData && categoriasData.length > 0) {
                    console.log('📋 Lista de categorías:', categoriasData.map(c => c.nombre).join(', '));
                    setCategorias(categoriasData);
                } else {
                    console.warn('⚠️ No se encontraron categorías activas');
                    setCategorias([]);
                }
            }
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtrarProductos = () => {
        let resultado = [...productos];

        // Filtrar por búsqueda
        if (busqueda.trim()) {
            const busquedaLower = busqueda.toLowerCase();
            resultado = resultado.filter(p =>
                p.nombre.toLowerCase().includes(busquedaLower) ||
                p.sku?.toLowerCase().includes(busquedaLower) ||
                p.codigo_barras?.toLowerCase().includes(busquedaLower)
            );
        }

        // Filtrar por categoría
        if (categoriaSeleccionada !== 'todas') {
            resultado = resultado.filter(p => p.categorias?.id === categoriaSeleccionada);
        }

        setProductosFiltrados(resultado);
    };

    const getStockStatus = (producto: Producto) => {
        if (producto.stock_actual === 0) {
            return { color: '#EF4444', text: 'Agotado', icon: '🔴' };
        } else if (producto.stock_actual <= producto.stock_minimo) {
            return { color: '#F59E0B', text: 'Bajo', icon: '⚠️' };
        } else if (producto.stock_actual >= producto.stock_maximo * 0.8) {
            return { color: '#10B981', text: 'Alto', icon: '✅' };
        } else {
            return { color: '#10B981', text: 'Normal', icon: '✅' };
        }
    };

    const renderProducto = ({ item }: { item: Producto }) => {
        const stockStatus = getStockStatus(item);
        const margen = item.precio_venta - item.precio_compra;
        const porcentajeMargen = ((margen / item.precio_compra) * 100).toFixed(0);

        return (
            <TouchableOpacity
                style={styles.productCard}
                onPress={() => {
                    setProductoSeleccionado(item);
                    setModalDetalleVisible(true);
                    setCantidadAjuste('');
                }}
                activeOpacity={0.7}
            >
                <View style={styles.productCardContent}>
                    {/* Imagen del producto */}
                    <View style={styles.productImageListContainer}>
                        {item.imagen_url ? (
                            <Image
                                source={{ uri: item.imagen_url }}
                                style={styles.productImageList}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.productImageListPlaceholder}>
                                <Text style={styles.productImageListIcon}>
                                    {item.categorias?.icono || '📦'}
                                </Text>
                            </View>
                        )}
                        {/* Badge de stock sobre la imagen */}
                        <View style={[styles.stockBadgeOverlay, { backgroundColor: stockStatus.color }]}>
                            <Text style={styles.stockBadgeOverlayText}>{item.stock_actual}</Text>
                        </View>
                    </View>

                    {/* Contenido del producto */}
                    <View style={styles.productCardRight}>
                        <View style={styles.productTopSection}>
                            <View style={styles.productInfo}>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {item.nombre}
                                </Text>
                                {item.categorias && (
                                    <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryBadgeText}>
                                            {item.categorias.nombre}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={[styles.stockStatusBadge, { backgroundColor: stockStatus.color + '15', borderColor: stockStatus.color }]}>
                                <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                                    {stockStatus.text}
                                </Text>
                            </View>
                        </View>

                        {/* Códigos */}
                        {(item.sku || item.codigo_barras) && (
                            <View style={styles.codesSection}>
                                {item.sku && (
                                    <View style={styles.codeChip}>
                                        <Text style={styles.codeChipText}>SKU: {item.sku}</Text>
                                    </View>
                                )}
                                {item.codigo_barras && (
                                    <View style={styles.codeChip}>
                                        <Text style={styles.codeChipText}>📊 {item.codigo_barras}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Precios */}
                        <View style={styles.pricesSection}>
                            <View style={styles.priceBox}>
                                <Text style={styles.priceLabel}>💰 Venta</Text>
                                <Text style={styles.priceValueLarge}>
                                    ${item.precio_venta.toLocaleString('es-CO')}
                                </Text>
                            </View>
                            <View style={styles.priceDivider} />
                            <View style={styles.priceBox}>
                                <Text style={styles.priceLabel}>📦 Compra</Text>
                                <Text style={styles.priceValueSmall}>
                                    ${item.precio_compra.toLocaleString('es-CO')}
                                </Text>
                            </View>
                            <View style={styles.priceDivider} />
                            <View style={styles.priceBox}>
                                <Text style={styles.priceLabel}>📈 Margen</Text>
                                <Text style={[styles.priceValueSmall, { color: '#10B981', fontWeight: 'bold' }]}>
                                    {porcentajeMargen}%
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const ajustarStockConConfirmacion = () => {
        if (!productoSeleccionado || !cantidadAjuste) return;

        const cantidad = parseInt(cantidadAjuste);
        if (isNaN(cantidad) || cantidad <= 0) {
            Alert.alert('Error', 'Por favor ingresa una cantidad válida');
            return;
        }

        const accion = tipoAjuste === 'sumar' ? 'agregar' : 'restar';
        const nuevoStock = tipoAjuste === 'sumar'
            ? productoSeleccionado.stock_actual + cantidad
            : productoSeleccionado.stock_actual - cantidad;

        if (nuevoStock < 0) {
            Alert.alert('Error', 'El stock no puede ser negativo');
            return;
        }

        Alert.alert(
            'Confirmar ajuste',
            `¿Deseas ${accion} ${cantidad} unidades?\nStock actual: ${productoSeleccionado.stock_actual}\nNuevo stock: ${nuevoStock}`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        await guardarStock(nuevoStock);
                        setCantidadAjuste('');
                        setTipoAjuste('sumar');
                    }
                }
            ]
        );
    };

    const ajustarStock = async (tipo: 'sumar' | 'restar') => {
        if (!productoSeleccionado || !cantidadAjuste) return;

        const cantidad = parseInt(cantidadAjuste);
        if (isNaN(cantidad) || cantidad <= 0) {
            Alert.alert('Error', 'Por favor ingresa una cantidad válida');
            return;
        }

        const nuevoStock = tipo === 'sumar'
            ? productoSeleccionado.stock_actual + cantidad
            : productoSeleccionado.stock_actual - cantidad;

        if (nuevoStock < 0) {
            Alert.alert('Error', 'El stock no puede ser negativo');
            return;
        }

        await guardarStock(nuevoStock);
        setCantidadAjuste('');
    };

    const guardarStockDirecto = async () => {
        if (!productoSeleccionado || !stockEditado) return;

        const nuevoStock = parseInt(stockEditado);
        if (isNaN(nuevoStock) || nuevoStock < 0) {
            Alert.alert('Error', 'Por favor ingresa un stock válido (mayor o igual a 0)');
            return;
        }

        Alert.alert(
            'Confirmar cambio',
            `¿Estás seguro de cambiar el stock de ${productoSeleccionado.stock_actual} a ${nuevoStock} unidades?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Guardar',
                    onPress: async () => {
                        await guardarStock(nuevoStock);
                        setModoEdicion(false);
                        setStockEditado('');
                    }
                }
            ]
        );
    };

    const guardarPreciosDirecto = async () => {
        if (!productoSeleccionado || !precioCompraEditado || !precioVentaEditado) return;

        const nuevoPrecioCompra = parseFloat(precioCompraEditado);
        const nuevoPrecioVenta = parseFloat(precioVentaEditado);

        if (isNaN(nuevoPrecioCompra) || nuevoPrecioCompra < 0) {
            Alert.alert('Error', 'Por favor ingresa un precio de compra válido');
            return;
        }

        if (isNaN(nuevoPrecioVenta) || nuevoPrecioVenta <= 0) {
            Alert.alert('Error', 'Por favor ingresa un precio de venta válido (mayor a 0)');
            return;
        }

        if (nuevoPrecioVenta <= nuevoPrecioCompra) {
            Alert.alert(
                'Advertencia',
                'El precio de venta es menor o igual al precio de compra. ¿Deseas continuar?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Continuar',
                        onPress: () => confirmarGuardarPrecios(nuevoPrecioCompra, nuevoPrecioVenta)
                    }
                ]
            );
            return;
        }

        confirmarGuardarPrecios(nuevoPrecioCompra, nuevoPrecioVenta);
    };

    const confirmarGuardarPrecios = (nuevoPrecioCompra: number, nuevoPrecioVenta: number) => {
        const margenAnterior = ((productoSeleccionado!.precio_venta - productoSeleccionado!.precio_compra) / productoSeleccionado!.precio_compra * 100).toFixed(1);
        const margenNuevo = ((nuevoPrecioVenta - nuevoPrecioCompra) / nuevoPrecioCompra * 100).toFixed(1);

        Alert.alert(
            'Confirmar cambio de precios',
            `Precio de compra: $${productoSeleccionado!.precio_compra.toLocaleString()} → $${nuevoPrecioCompra.toLocaleString()}\n` +
            `Precio de venta: $${productoSeleccionado!.precio_venta.toLocaleString()} → $${nuevoPrecioVenta.toLocaleString()}\n` +
            `Margen: ${margenAnterior}% → ${margenNuevo}%`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Guardar',
                    onPress: async () => {
                        await guardarPrecios(nuevoPrecioCompra, nuevoPrecioVenta);
                    }
                }
            ]
        );
    };

    const guardarPrecios = async (nuevoPrecioCompra: number, nuevoPrecioVenta: number) => {
        if (!productoSeleccionado) return;

        try {
            setGuardando(true);

            const margen = ((nuevoPrecioVenta - nuevoPrecioCompra) / nuevoPrecioCompra * 100);

            const { error } = await supabase
                .from('productos')
                .update({
                    precio_compra: nuevoPrecioCompra,
                    precio_venta: nuevoPrecioVenta,
                    margen_ganancia: margen
                })
                .eq('id', productoSeleccionado.id);

            if (error) {
                console.error('❌ Error actualizando precios:', error);
                Alert.alert('Error', 'Error al actualizar los precios');
                return;
            }

            // Actualizar localmente
            setProductos(prev => prev.map(p =>
                p.id === productoSeleccionado.id
                    ? {
                        ...p,
                        precio_compra: nuevoPrecioCompra,
                        precio_venta: nuevoPrecioVenta
                    }
                    : p
            ));

            setProductoSeleccionado({
                ...productoSeleccionado,
                precio_compra: nuevoPrecioCompra,
                precio_venta: nuevoPrecioVenta
            });

            setModoEdicionPrecios(false);
            setPrecioCompraEditado('');
            setPrecioVentaEditado('');
            Alert.alert('Éxito', 'Precios actualizados correctamente');
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'Error al actualizar los precios');
        } finally {
            setGuardando(false);
        }
    };

    const guardarStock = async (nuevoStock: number) => {
        if (!productoSeleccionado) return;

        try {
            setGuardando(true);

            const { error } = await supabase
                .from('productos')
                .update({ stock_actual: nuevoStock })
                .eq('id', productoSeleccionado.id);

            if (error) {
                console.error('❌ Error actualizando stock:', error);
                Alert.alert('Error', 'Error al actualizar el stock');
                return;
            }

            // Actualizar localmente
            setProductos(prev => prev.map(p =>
                p.id === productoSeleccionado.id
                    ? { ...p, stock_actual: nuevoStock }
                    : p
            ));

            setProductoSeleccionado({ ...productoSeleccionado, stock_actual: nuevoStock });
            Alert.alert('Éxito', 'Stock actualizado correctamente');
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'Error al actualizar el stock');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarProducto = async () => {
        if (!productoSeleccionado) return;

        Alert.alert(
            'Confirmar eliminación',
            '¿Estás seguro de eliminar este producto?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setGuardando(true);
                            const { error } = await supabase
                                .from('productos')
                                .update({ activo: false })
                                .eq('id', productoSeleccionado.id);

                            if (error) {
                                console.error('❌ Error eliminando producto:', error);
                                Alert.alert('Error', 'Error al eliminar el producto');
                                return;
                            }

                            // Actualizar localmente
                            setProductos(prev => prev.filter(p => p.id !== productoSeleccionado.id));
                            setModalDetalleVisible(false);
                            Alert.alert('Éxito', 'Producto eliminado correctamente');
                        } catch (error) {
                            console.error('❌ Error:', error);
                            Alert.alert('Error', 'Error al eliminar el producto');
                        } finally {
                            setGuardando(false);
                        }
                    }
                }
            ]
        );
    };

    const agregarProducto = async () => {
        // Validaciones
        if (!nuevoProducto.nombre.trim()) {
            Alert.alert('Error', 'El nombre del producto es obligatorio');
            return;
        }

        if (!nuevoProducto.categoria_id) {
            Alert.alert('Error', 'Debes seleccionar una categoría');
            return;
        }

        const precioCompra = parseFloat(nuevoProducto.precio_compra);
        const precioVenta = parseFloat(nuevoProducto.precio_venta);
        const stockActual = parseInt(nuevoProducto.stock_actual);
        const stockMinimo = parseInt(nuevoProducto.stock_minimo);
        const stockMaximo = parseInt(nuevoProducto.stock_maximo);

        if (isNaN(precioCompra) || precioCompra < 0) {
            Alert.alert('Error', 'El precio de compra debe ser un número válido');
            return;
        }

        if (isNaN(precioVenta) || precioVenta <= 0) {
            Alert.alert('Error', 'El precio de venta debe ser mayor a 0');
            return;
        }

        if (isNaN(stockActual) || stockActual < 0) {
            Alert.alert('Error', 'El stock actual debe ser un número válido');
            return;
        }

        if (isNaN(stockMinimo) || stockMinimo < 0) {
            Alert.alert('Error', 'El stock mínimo debe ser un número válido');
            return;
        }

        if (isNaN(stockMaximo) || stockMaximo <= 0) {
            Alert.alert('Error', 'El stock máximo debe ser mayor a 0');
            return;
        }

        if (precioVenta <= precioCompra) {
            Alert.alert(
                'Advertencia',
                'El precio de venta es menor o igual al precio de compra. ¿Deseas continuar?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Continuar', onPress: () => guardarNuevoProducto() }
                ]
            );
            return;
        }

        guardarNuevoProducto();
    };

    const guardarNuevoProducto = async () => {
        try {
            setGuardando(true);

            const precioCompra = parseFloat(nuevoProducto.precio_compra);
            const precioVenta = parseFloat(nuevoProducto.precio_venta);
            const margen = ((precioVenta - precioCompra) / precioCompra * 100);

            const productoData = {
                tienda_id: tiendaActual?.tiendas?.id,
                nombre: nuevoProducto.nombre.trim(),
                categoria_id: nuevoProducto.categoria_id,
                precio_compra: precioCompra,
                precio_venta: precioVenta,
                margen_ganancia: margen,
                stock_actual: parseInt(nuevoProducto.stock_actual),
                stock_minimo: parseInt(nuevoProducto.stock_minimo),
                stock_maximo: parseInt(nuevoProducto.stock_maximo),
                sku: nuevoProducto.sku.trim() || null,
                codigo_barras: nuevoProducto.codigo_barras.trim() || null,
                activo: true,
            };

            const { data, error } = await supabase
                .from('productos')
                .insert([productoData])
                .select(`
                    id,
                    nombre,
                    precio_venta,
                    precio_compra,
                    stock_actual,
                    stock_minimo,
                    stock_maximo,
                    codigo_barras,
                    sku,
                    imagen_url,
                    categorias:categoria_id (
                        id,
                        nombre,
                        icono
                    )
                `)
                .single();

            if (error) {
                console.error('❌ Error agregando producto:', error);
                Alert.alert('Error', 'Error al agregar el producto');
                return;
            }

            // Actualizar lista local
            setProductos(prev => [data, ...prev]);

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

            setModalAgregarVisible(false);
            Alert.alert('Éxito', 'Producto agregado correctamente');
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'Error al agregar el producto');
        } finally {
            setGuardando(false);
        }
    };

    const cambiarImagen = () => {
        Alert.alert(
            'Cambiar imagen',
            'Selecciona una opción',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: '📷 Tomar foto',
                    onPress: tomarFoto
                },
                {
                    text: '🖼️ Seleccionar de galería',
                    onPress: seleccionarImagen
                }
            ]
        );
    };

    const tomarFoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para tomar fotos');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                await subirImagen(result.assets[0].uri);
            }
        } catch (error) {
            console.error('❌ Error tomando foto:', error);
            Alert.alert('Error', 'Error al tomar la foto');
        }
    };

    const seleccionarImagen = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería para seleccionar imágenes');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                await subirImagen(result.assets[0].uri);
            }
        } catch (error) {
            console.error('❌ Error seleccionando imagen:', error);
            Alert.alert('Error', 'Error al seleccionar la imagen');
        }
    };

    const subirImagen = async (uri: string) => {
        if (!productoSeleccionado) return;

        try {
            setGuardando(true);

            // Obtener la extensión del archivo
            const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${productoSeleccionado.id}-${Date.now()}.${ext}`;
            const filePath = `${tiendaActual?.tiendas?.id}/${fileName}`;

            // Leer el archivo como base64
            const response = await fetch(uri);
            const blob = await response.blob();
            const arrayBuffer = await new Response(blob).arrayBuffer();

            // Subir a Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('productos')
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${ext}`,
                    upsert: true
                });

            if (uploadError) {
                console.error('❌ Error subiendo imagen:', uploadError);
                Alert.alert('Error', 'Error al subir la imagen');
                return;
            }

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('productos')
                .getPublicUrl(filePath);

            // Actualizar producto en la base de datos
            const { error: updateError } = await supabase
                .from('productos')
                .update({ imagen_url: publicUrl })
                .eq('id', productoSeleccionado.id);

            if (updateError) {
                console.error('❌ Error actualizando producto:', updateError);
                Alert.alert('Error', 'Error al actualizar el producto');
                return;
            }

            // Actualizar localmente
            setProductos(prev => prev.map(p =>
                p.id === productoSeleccionado.id
                    ? { ...p, imagen_url: publicUrl }
                    : p
            ));

            setProductoSeleccionado({
                ...productoSeleccionado,
                imagen_url: publicUrl
            });

            Alert.alert('Éxito', 'Imagen actualizada correctamente');
        } catch (error) {
            console.error('❌ Error:', error);
            Alert.alert('Error', 'Error al procesar la imagen');
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
                    <Text style={styles.loadingText}>Cargando inventario...</Text>
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
                    <Text style={styles.title}>📦 Inventario</Text>
                    <Text style={styles.subtitle}>
                        {productosFiltrados.length} productos
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setModalFiltrosVisible(true)}
                >
                    <Text style={styles.filterButtonText}>🔍</Text>
                </TouchableOpacity>
            </View>

            {/* Barra de búsqueda */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nombre, SKU o código..."
                    value={busqueda}
                    onChangeText={setBusqueda}
                    placeholderTextColor="#9CA3AF"
                />
                {busqueda.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setBusqueda('')}
                    >
                        <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Filtro rápido de categorías */}
            {categorias.length > 0 && (
                <View style={styles.categoriesSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesContainer}
                    >
                        <TouchableOpacity
                            style={[
                                styles.categoryChip,
                                categoriaSeleccionada === 'todas' && styles.categoryChipActive
                            ]}
                            onPress={() => setCategoriaSeleccionada('todas')}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                categoriaSeleccionada === 'todas' && styles.categoryChipTextActive
                            ]}>
                                Todas
                            </Text>
                        </TouchableOpacity>
                        {categorias.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryChip,
                                    categoriaSeleccionada === cat.id && styles.categoryChipActive
                                ]}
                                onPress={() => setCategoriaSeleccionada(cat.id)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    categoriaSeleccionada === cat.id && styles.categoryChipTextActive
                                ]}>
                                    {cat.nombre}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Lista de productos */}
            {productosFiltrados.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>No hay productos</Text>
                    <Text style={styles.emptyText}>
                        {busqueda || categoriaSeleccionada !== 'todas'
                            ? 'No se encontraron productos con los filtros aplicados'
                            : 'Aún no has agregado productos a tu inventario'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={productosFiltrados}
                    renderItem={renderProducto}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Modal de Filtros */}
            <Modal
                visible={modalFiltrosVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalFiltrosVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtros</Text>
                            <TouchableOpacity
                                onPress={() => setModalFiltrosVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalText}>Próximamente más filtros...</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Agregar Producto */}
            <Modal
                visible={modalAgregarVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalAgregarVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerLarge}>
                        {/* Header del Modal */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>➕ Agregar Producto</Text>
                            <TouchableOpacity
                                onPress={() => setModalAgregarVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
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
                                    onPress={() => setModalAgregarVisible(false)}
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

            {/* Modal de Detalle del Producto */}
            <Modal
                visible={modalDetalleVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalDetalleVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerLarge}>
                        {productoSeleccionado && (
                            <>
                                {/* Header del Modal */}
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Detalle del Producto</Text>
                                    <TouchableOpacity
                                        onPress={() => setModalDetalleVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalContent}>
                                    {/* Imagen/Icono del producto */}
                                    <View style={styles.productImageSection}>
                                        <View style={styles.productImageContainer}>
                                            {productoSeleccionado.imagen_url ? (
                                                <Image
                                                    source={{ uri: productoSeleccionado.imagen_url }}
                                                    style={styles.productImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <Text style={styles.productImagePlaceholder}>
                                                    {productoSeleccionado.categorias?.icono || '📦'}
                                                </Text>
                                            )}
                                        </View>
                                        {esAdmin && (
                                            <TouchableOpacity
                                                style={styles.changeImageButton}
                                                onPress={cambiarImagen}
                                                disabled={guardando}
                                            >
                                                <Text style={styles.changeImageButtonText}>
                                                    {guardando ? '⏳ Subiendo...' : '📷 Cambiar imagen'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Información del producto */}
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailProductName}>
                                            {productoSeleccionado.nombre}
                                        </Text>
                                        {productoSeleccionado.categorias && (
                                            <Text style={styles.detailCategory}>
                                                🏷️ {productoSeleccionado.categorias.nombre}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Códigos */}
                                    {(productoSeleccionado.sku || productoSeleccionado.codigo_barras) && (
                                        <View style={styles.detailSection}>
                                            {productoSeleccionado.sku && (
                                                <Text style={styles.detailCode}>SKU: {productoSeleccionado.sku}</Text>
                                            )}
                                            {productoSeleccionado.codigo_barras && (
                                                <Text style={styles.detailCode}>
                                                    Código de barras: {productoSeleccionado.codigo_barras}
                                                </Text>
                                            )}
                                        </View>
                                    )}

                                    {/* Stock actual */}
                                    <View style={styles.detailSection}>
                                        <View style={styles.stockHeader}>
                                            <Text style={styles.detailLabel}>Stock Actual</Text>
                                            {!modoEdicion && (
                                                <TouchableOpacity
                                                    style={styles.editButton}
                                                    onPress={() => {
                                                        setModoEdicion(true);
                                                        setStockEditado(productoSeleccionado.stock_actual.toString());
                                                    }}
                                                >
                                                    <Text style={styles.editButtonText}>✏️ Editar</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {modoEdicion ? (
                                            <View style={styles.editStockContainer}>
                                                <TextInput
                                                    style={styles.editStockInput}
                                                    keyboardType="numeric"
                                                    value={stockEditado}
                                                    onChangeText={setStockEditado}
                                                    placeholder="Nuevo stock"
                                                    placeholderTextColor="#9CA3AF"
                                                    autoFocus
                                                />
                                                <View style={styles.editStockButtons}>
                                                    <TouchableOpacity
                                                        style={[styles.editStockButton, styles.editStockButtonCancel]}
                                                        onPress={() => {
                                                            setModoEdicion(false);
                                                            setStockEditado('');
                                                        }}
                                                        disabled={guardando}
                                                    >
                                                        <Text style={styles.editStockButtonText}>Cancelar</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.editStockButton, styles.editStockButtonSave]}
                                                        onPress={guardarStockDirecto}
                                                        disabled={guardando || !stockEditado}
                                                    >
                                                        <Text style={[styles.editStockButtonText, { color: '#fff' }]}>
                                                            {guardando ? 'Guardando...' : '💾 Guardar'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={styles.stockDisplay}>
                                                <Text style={styles.stockDisplayNumber}>
                                                    {productoSeleccionado.stock_actual}
                                                </Text>
                                                <Text style={styles.stockDisplayLabel}>unidades</Text>
                                            </View>
                                        )}

                                        <View style={styles.stockRange}>
                                            <Text style={styles.stockRangeText}>
                                                Mínimo: {productoSeleccionado.stock_minimo}
                                            </Text>
                                            <Text style={styles.stockRangeText}>
                                                Máximo: {productoSeleccionado.stock_maximo}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Precios */}
                                    <View style={styles.detailSection}>
                                        <View style={styles.stockHeader}>
                                            <Text style={styles.detailLabel}>Precios</Text>
                                            {!modoEdicionPrecios && esAdmin && (
                                                <TouchableOpacity
                                                    style={styles.editButton}
                                                    onPress={() => {
                                                        setModoEdicionPrecios(true);
                                                        setPrecioCompraEditado(productoSeleccionado.precio_compra.toString());
                                                        setPrecioVentaEditado(productoSeleccionado.precio_venta.toString());
                                                    }}
                                                >
                                                    <Text style={styles.editButtonText}>✏️ Editar</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {modoEdicionPrecios ? (
                                            <View style={styles.editPricesContainer}>
                                                <View style={styles.priceEditRow}>
                                                    <View style={styles.priceEditItem}>
                                                        <Text style={styles.priceEditLabel}>Precio Compra</Text>
                                                        <TextInput
                                                            style={styles.priceEditInput}
                                                            keyboardType="numeric"
                                                            value={precioCompraEditado}
                                                            onChangeText={setPrecioCompraEditado}
                                                            placeholder="0"
                                                            placeholderTextColor="#9CA3AF"
                                                        />
                                                    </View>
                                                    <View style={styles.priceEditItem}>
                                                        <Text style={styles.priceEditLabel}>Precio Venta</Text>
                                                        <TextInput
                                                            style={styles.priceEditInput}
                                                            keyboardType="numeric"
                                                            value={precioVentaEditado}
                                                            onChangeText={setPrecioVentaEditado}
                                                            placeholder="0"
                                                            placeholderTextColor="#9CA3AF"
                                                        />
                                                    </View>
                                                </View>
                                                <View style={styles.editStockButtons}>
                                                    <TouchableOpacity
                                                        style={[styles.editStockButton, styles.editStockButtonCancel]}
                                                        onPress={() => {
                                                            setModoEdicionPrecios(false);
                                                            setPrecioCompraEditado('');
                                                            setPrecioVentaEditado('');
                                                        }}
                                                        disabled={guardando}
                                                    >
                                                        <Text style={styles.editStockButtonText}>Cancelar</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={[styles.editStockButton, styles.editStockButtonSave]}
                                                        onPress={guardarPreciosDirecto}
                                                        disabled={guardando || !precioCompraEditado || !precioVentaEditado}
                                                    >
                                                        <Text style={[styles.editStockButtonText, { color: '#fff' }]}>
                                                            {guardando ? 'Guardando...' : '💾 Guardar'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={styles.priceRow}>
                                                <View style={styles.priceItem}>
                                                    <Text style={styles.priceLabel}>Compra</Text>
                                                    <Text style={styles.priceValue}>
                                                        ${productoSeleccionado.precio_compra.toLocaleString('es-CO')}
                                                    </Text>
                                                </View>
                                                <View style={styles.priceItem}>
                                                    <Text style={styles.priceLabel}>Venta</Text>
                                                    <Text style={[styles.priceValue, { color: '#10B981' }]}>
                                                        ${productoSeleccionado.precio_venta.toLocaleString('es-CO')}
                                                    </Text>
                                                </View>
                                                <View style={styles.priceItem}>
                                                    <Text style={styles.priceLabel}>Margen</Text>
                                                    <Text style={[styles.priceValue, { color: '#10B981' }]}>
                                                        {(((productoSeleccionado.precio_venta - productoSeleccionado.precio_compra) / productoSeleccionado.precio_compra) * 100).toFixed(0)}%
                                                    </Text>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {/* Ajustar Stock */}
                                    <View style={styles.detailSection}>
                                        <Text style={styles.detailLabel}>Ajustar Stock</Text>

                                        <View style={styles.stockAdjustContainer}>
                                            {esAdmin && (
                                                <TouchableOpacity
                                                    style={styles.stockAdjustButton}
                                                    onPress={() => {
                                                        const cantidad = parseInt(cantidadAjuste) || 1;
                                                        setCantidadAjuste(cantidad.toString());
                                                        ajustarStock('restar');
                                                    }}
                                                    disabled={guardando}
                                                >
                                                    <Text style={styles.stockAdjustButtonText}>➖</Text>
                                                </TouchableOpacity>
                                            )}

                                            <TextInput
                                                style={styles.stockAdjustInput}
                                                placeholder="Cantidad"
                                                keyboardType="numeric"
                                                value={cantidadAjuste}
                                                onChangeText={setCantidadAjuste}
                                                placeholderTextColor="#9CA3AF"
                                            />

                                            <TouchableOpacity
                                                style={styles.stockAdjustButton}
                                                onPress={() => {
                                                    const cantidad = parseInt(cantidadAjuste) || 1;
                                                    setCantidadAjuste(cantidad.toString());
                                                    ajustarStock('sumar');
                                                }}
                                                disabled={guardando}
                                            >
                                                <Text style={styles.stockAdjustButtonText}>➕</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Botón Guardar Ajuste */}
                                        <TouchableOpacity
                                            style={[
                                                styles.saveAdjustButton,
                                                (!cantidadAjuste || guardando) && styles.saveAdjustButtonDisabled
                                            ]}
                                            onPress={ajustarStockConConfirmacion}
                                            disabled={!cantidadAjuste || guardando}
                                        >
                                            <Text style={styles.saveAdjustButtonText}>
                                                {guardando ? 'Guardando...' : '💾 Guardar Ajuste'}
                                            </Text>
                                        </TouchableOpacity>

                                        {!esAdmin && (
                                            <Text style={styles.permissionNote}>
                                                ℹ️ Solo puedes agregar stock. Contacta a un administrador para restar.
                                            </Text>
                                        )}
                                    </View>

                                    {/* Botón de eliminar (solo admin) */}
                                    {esAdmin && (
                                        <View style={[styles.detailSection, styles.deleteSection]}>
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={eliminarProducto}
                                                disabled={guardando}
                                            >
                                                <Text style={styles.deleteButtonText}>
                                                    {guardando ? 'Eliminando...' : '🗑️ Eliminar Producto'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Margen inferior */}
                                    <View style={styles.bottomMargin} />
                                </ScrollView>
                            </>
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
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterButtonText: {
        fontSize: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    searchInput: {
        flex: 1,
        height: 48,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1F2937',
    },
    clearButton: {
        position: 'absolute',
        right: 24,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#9CA3AF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    categoriesSection: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    categoriesContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryChipActive: {
        backgroundColor: '#10B981',
    },
    categoryChipText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    categoryChipTextActive: {
        color: '#FFFFFF',
    },
    listContainer: {
        padding: 16,
    },
    productCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    productCardContent: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    productImageListContainer: {
        width: 70,
        height: 70,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
        flexShrink: 0,
    },
    productImageList: {
        width: '100%',
        height: '100%',
    },
    productImageListPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    productImageListIcon: {
        fontSize: 36,
    },
    stockBadgeOverlay: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        minWidth: 28,
        alignItems: 'center',
    },
    stockBadgeOverlayText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    productCardRight: {
        flex: 1,
        justifyContent: 'space-between',
    },
    productTopSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    productInfo: {
        flex: 1,
        marginRight: 8,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 5,
        lineHeight: 19,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
    },
    stockStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 7,
        borderWidth: 1,
    },
    stockStatusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    codesSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
        marginBottom: 8,
    },
    codeChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 5,
    },
    codeChipText: {
        fontSize: 9,
        color: '#3B82F6',
        fontWeight: '600',
    },
    pricesSection: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    priceBox: {
        flex: 1,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 9,
        color: '#6B7280',
        marginBottom: 2,
        fontWeight: '500',
    },
    priceValueLarge: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
    },
    priceValueSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F2937',
    },
    priceDivider: {
        width: 1,
        height: 26,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 3,
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    productInfo: {
        flex: 1,
        marginRight: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 14,
        color: '#6B7280',
    },
    stockBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    stockBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    productDetails: {
        marginBottom: 12,
    },
    productSku: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    productStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    separator: {
        height: 12,
    },
    separator: {
        height: 12,
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
    modalText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    modalContainerLarge: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    productImageSection: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    productImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productImagePlaceholder: {
        fontSize: 64,
    },
    changeImageButton: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    changeImageButtonText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    detailSection: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    detailProductName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    detailCategory: {
        fontSize: 16,
        color: '#6B7280',
    },
    detailCode: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    stockHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
    },
    editButtonText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    editStockContainer: {
        marginBottom: 12,
    },
    editStockInput: {
        height: 56,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    editStockButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    editStockButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editStockButtonCancel: {
        backgroundColor: '#F3F4F6',
    },
    editStockButtonSave: {
        backgroundColor: '#10B981',
    },
    editStockButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    stockDisplay: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        marginBottom: 12,
    },
    stockDisplayNumber: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#10B981',
    },
    stockDisplayLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    stockRange: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    stockRangeText: {
        fontSize: 14,
        color: '#6B7280',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    priceItem: {
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    editPricesContainer: {
        marginTop: 8,
    },
    priceEditRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    priceEditItem: {
        flex: 1,
    },
    priceEditLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    priceEditInput: {
        height: 48,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
    },
    stockAdjustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stockAdjustButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stockAdjustButtonText: {
        fontSize: 28,
        color: '#fff',
    },
    stockAdjustInput: {
        flex: 1,
        height: 56,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
    },
    stockInput: {
        height: 48,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 12,
    },
    stockButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    stockButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stockButtonAdd: {
        backgroundColor: '#10B981',
    },
    stockButtonRemove: {
        backgroundColor: '#EF4444',
    },
    stockButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    permissionNote: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
    },
    deleteButton: {
        height: 48,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    deleteSection: {
        marginTop: 8,
    },
    saveAdjustButton: {
        height: 48,
        backgroundColor: '#10B981',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    saveAdjustButtonDisabled: {
        backgroundColor: '#9CA3AF',
        opacity: 0.5,
    },
    saveAdjustButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    bottomMargin: {
        height: 40,
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
});
