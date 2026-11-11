import {
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import Encabezado from '../components/Encabezado'
import { Boton, Cargando, Mensaje } from '../components/Controles'
import { useAccionesCarrito, useCarrito } from '../context/CarritoContext'
import { useCatalogo } from '../context/CatalogoContext'
import { useTema } from '../context/TemaContext'
import { obtenerPrecioFinal } from '../utils/precios'
import { formatearPrecio } from '../utils/formato'

const NUMERO_WHATSAPP = '5491133328382'
const imagenSinProducto = require('../../assets/icon.png')

export default function CarritoScreen({ navigation }) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const {
    items,
    cargandoCarrito,
  } = useCarrito()
  const {
    cambiarCantidad,
    quitarDelCarrito,
    vaciarCarrito,
  } = useAccionesCarrito()
  const { productos, configuracionPrecios, cargarCatalogo } = useCatalogo()

  if (cargandoCarrito) return <Cargando mensaje="Cargando carrito..." />
  if (items.length > 0 && !configuracionPrecios) {
    return (
      <View style={[estilos.pantalla, estilos.estadoError]}>
        <Encabezado
          navigation={navigation}
          titulo="Tu carrito"
          subtitulo="No pudimos consultar los precios actuales."
        />
        <Mensaje
          titulo="El carrito no está disponible por ahora"
          detalle="Conectate a internet e intentá actualizar el catálogo."
          tipo="error"
        />
        <Boton
          titulo="Reintentar"
          variante="secundario"
          onPress={() => cargarCatalogo().catch((error) => {
            Alert.alert('No se pudo actualizar', error.message)
          })}
        />
      </View>
    )
  }

  const lineas = items.map((producto) => {
    const productoActual = productos.find((item) => item.id === producto.id) || producto
    const productoConCantidad = { ...productoActual, cantidad: producto.cantidad }
    const precio = obtenerPrecioFinal(productoActual, configuracionPrecios)
    return { producto: productoConCantidad, precio, subtotal: precio * producto.cantidad }
  })
  const total = lineas.reduce((suma, linea) => suma + linea.subtotal, 0)

  async function realizarPedido() {
    const detalle = lineas.map(({ producto, precio, subtotal }) => (
      `- ${producto.titulo}: ${producto.cantidad} x ${formatearPrecio(precio)} = ${formatearPrecio(subtotal)}`
    ))
    detalle.push('', `Total a pagar: ${formatearPrecio(total)}`)
    const mensaje = `Alebourg, quiero realizar el siguiente pedido:\n\n${detalle.join('\n')}`
    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`
    try {
      await Linking.openURL(url)
    } catch (error) {
      console.error('No se pudo abrir WhatsApp:', error)
      Alert.alert('No se pudo abrir WhatsApp', 'Revisá que WhatsApp esté disponible e intentá nuevamente.')
    }
  }

  return (
    <FlatList
      style={estilos.pantalla}
      data={lineas}
      keyExtractor={({ producto }) => String(producto.id)}
      contentContainerStyle={estilos.lista}
      ListHeaderComponent={(
        <Encabezado
          navigation={navigation}
          titulo="Tu carrito"
          subtitulo="Revisá los productos antes de coordinar tu compra."
        />
      )}
      ListEmptyComponent={(
        <View style={estilos.vacio}>
          <Feather name="shopping-cart" size={38} color={colores.secundaria} />
          <Mensaje
            titulo="El carrito está vacío"
            detalle="Explorá la tienda y agregá los productos que te interesan."
          />
          <Boton
            titulo="Ir a la tienda"
            onPress={() => navigation.navigate('Principal', { screen: 'Tienda' })}
          />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={estilos.separador} />}
      renderItem={({ item: { producto, precio, subtotal } }) => (
        <View style={estilos.producto}>
          <Image
            source={producto.imagen ? { uri: producto.imagen } : imagenSinProducto}
            style={estilos.imagen}
            resizeMode="contain"
          />
          <View style={estilos.detalles}>
            <Text style={estilos.nombre} numberOfLines={2}>{producto.titulo}</Text>
            <Text style={estilos.precio}>{formatearPrecio(precio)} c/u</Text>
            <Text style={estilos.subtotal}>Subtotal: {formatearPrecio(subtotal)}</Text>
            <View style={estilos.controles}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Disminuir cantidad de ${producto.titulo}`}
                onPress={() => cambiarCantidad(producto.id, -1)}
                style={estilos.controlCantidad}
              >
                <Feather name="minus" size={17} color={colores.tinta} />
              </Pressable>
              <Text style={estilos.cantidad}>{producto.cantidad}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Aumentar cantidad de ${producto.titulo}`}
                onPress={() => cambiarCantidad(producto.id, 1)}
                style={estilos.controlCantidad}
              >
                <Feather name="plus" size={17} color={colores.tinta} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${producto.titulo} del carrito`}
                onPress={() => quitarDelCarrito(producto.id)}
                style={estilos.quitar}
              >
                <Feather name="trash-2" size={17} color={colores.error} />
              </Pressable>
            </View>
          </View>
        </View>
      )}
      ListFooterComponent={lineas.length > 0 ? (
        <View style={estilos.resumen}>
          <View style={estilos.filaTotal}>
            <Text style={estilos.etiquetaTotal}>Total a pagar</Text>
            <Text style={estilos.total}>{formatearPrecio(total)}</Text>
          </View>
          <Text style={estilos.nota}>
            El pedido se coordina por WhatsApp. No se guarda una cuenta ni un pedido en la app.
          </Text>
          <Boton titulo="Realizar pedido por WhatsApp" onPress={realizarPedido} />
          <Boton
            titulo="Vaciar carrito"
            variante="secundario"
            onPress={() => Alert.alert(
              'Vaciar carrito',
              '¿Querés quitar todos los productos?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Vaciar', style: 'destructive', onPress: vaciarCarrito },
              ],
            )}
          />
        </View>
      ) : null}
    />
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  estadoError: { paddingHorizontal: 16, gap: 12 },
  lista: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 28 },
  vacio: { flex: 1, paddingHorizontal: 4, paddingTop: 24, gap: 16 },
  producto: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.linea,
    flexDirection: 'row',
    gap: 12,
  },
  imagen: { width: 92, height: 104, borderRadius: 12, backgroundColor: colores.superficie },
  detalles: { flex: 1, justifyContent: 'center', gap: 5 },
  nombre: { color: colores.tinta, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  precio: { color: colores.secundaria, fontSize: 13 },
  subtotal: { color: colores.tinta, fontSize: 14, fontWeight: '700' },
  controles: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  controlCantidad: {
    width: 33,
    height: 33,
    borderRadius: 11,
    backgroundColor: colores.primarioClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidad: { minWidth: 18, textAlign: 'center', color: colores.tinta, fontWeight: '800' },
  quitar: { marginLeft: 'auto', padding: 8 },
  separador: { height: 12 },
  resumen: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.linea,
    gap: 12,
  },
  filaTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etiquetaTotal: { color: colores.tinta, fontSize: 17, fontWeight: '700' },
  total: { color: colores.tinta, fontSize: 22, fontWeight: '800' },
  nota: { color: colores.secundaria, fontSize: 13, lineHeight: 19 },
  })
}
