import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { obtenerProducto } from '../api/productos'
import { obtenerErrorApi } from '../api/client'
import { eliminarProducto } from '../api/administracionProductos'
import { Boton, Cargando, Mensaje } from '../components/Controles'
import { useAccionesCarrito } from '../context/CarritoContext'
import { useCatalogo } from '../context/CatalogoContext'
import { useTema } from '../context/TemaContext'
import { useAuth } from '../context/AuthContext'
import { useAdminPreferencias } from '../context/AdminPreferenciasContext'
import { obtenerPrecioFinal, parsearPrecio } from '../utils/precios'
import { formatearPrecio } from '../utils/formato'

const imagenSinProducto = require('../../assets/icon.png')

export default function DetalleProductoScreen({ route, navigation }) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const insets = useSafeAreaInsets()
  const { productoId } = route.params
  const { productos, configuracionPrecios } = useCatalogo()
  const { agregarAlCarrito } = useAccionesCarrito()
  const { isAdmin } = useAuth()
  const { mostrarPreciosAdmin } = useAdminPreferencias()
  const [mostrarImagenCompleta, setMostrarImagenCompleta] = useState(false)
  const [indiceImagen, setIndiceImagen] = useState(0)
  const [anchoGaleria, setAnchoGaleria] = useState(0)
  const [eliminando, setEliminando] = useState(false)
  const productoDelCatalogo = productos.find((item) => item.id === Number(productoId))
  const [producto, setProducto] = useState(productoDelCatalogo || null)
  const [cargando, setCargando] = useState(!productoDelCatalogo)
  const [error, setError] = useState('')

  useEffect(() => {
    if (productoDelCatalogo) {
      setProducto(productoDelCatalogo)
      setCargando(false)
      return
    }

    let activo = true
    setCargando(true)
    setError('')
    obtenerProducto(productoId)
      .then((resultado) => { if (activo) setProducto(resultado) })
      .catch((errorCarga) => {
        if (activo) setError(obtenerErrorApi(errorCarga, 'No se pudo cargar este producto.'))
      })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [productoId, productoDelCatalogo])

  if (cargando) return <Cargando mensaje="Cargando producto..." />

  if (error || !producto) {
    return (
      <View style={estilos.estado}>
        <Mensaje titulo="No se pudo cargar el producto" detalle={error || 'Producto no encontrado.'} tipo="error" />
        <View style={estilos.botonEstado}>
          <Boton titulo="Volver a la tienda" onPress={() => navigation.goBack()} variante="secundario" />
        </View>
      </View>
    )
  }

  let precio
  let precioProveedor
  let ganancia
  try {
    precio = obtenerPrecioFinal(producto, configuracionPrecios)
    if (isAdmin && mostrarPreciosAdmin) {
      precioProveedor = parsearPrecio(producto.precio)
      ganancia = Math.max(0, precio - precioProveedor)
    }
  } catch (errorPrecio) {
    return (
      <View style={estilos.estado}>
        <Mensaje titulo="No se puede mostrar el precio" detalle={errorPrecio.message} tipo="error" />
      </View>
    )
  }

  const imagenesProducto = producto.imagenes?.length
    ? producto.imagenes
    : producto.imagen ? [producto.imagen] : ['']
  const imagenSeleccionada = imagenesProducto[indiceImagen] || imagenesProducto[0]
  const precioRegular = producto.enOferta
    ? obtenerPrecioFinal({ ...producto, precioFinal: null }, configuracionPrecios)
    : precio
  const tieneDescuento = producto.enOferta && precio < precioRegular

  function solicitarEliminacion() {
    Alert.alert(
      'Eliminar producto',
      'Se eliminará de la base de datos. Si vuelve a aparecer en una importación futura, podrá cargarse nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setEliminando(true)
            try {
              await eliminarProducto(producto.id)
              let errorRecarga = null
              try {
                await cargarCatalogo()
              } catch (errorCarga) {
                errorRecarga = errorCarga
              }
              navigation.navigate('Principal', { screen: 'Tienda' })
              if (errorRecarga) {
                Alert.alert(
                  'Producto eliminado',
                  `No se pudo actualizar la tienda. Volvé a cargarla para ver los cambios. ${obtenerErrorApi(errorRecarga, '')}`,
                )
              }
            } catch (errorBorrado) {
              Alert.alert('No se pudo eliminar', obtenerErrorApi(errorBorrado, 'Intentá de nuevo.'))
            } finally {
              setEliminando(false)
            }
          },
        },
      ],
    )
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.tarjeta}>
          <View onLayout={({ nativeEvent }) => setAnchoGaleria(nativeEvent.layout.width)}>
            <ScrollView
              horizontal
              pagingEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={({ nativeEvent }) => {
                if (anchoGaleria > 0) setIndiceImagen(Math.round(nativeEvent.contentOffset.x / anchoGaleria))
              }}
            >
              {imagenesProducto.map((imagen, indice) => (
                <Pressable
                  key={`${imagen}-${indice}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver foto ${indice + 1} de ${imagenesProducto.length} a pantalla completa`}
                  onPress={() => {
                    setIndiceImagen(indice)
                    setMostrarImagenCompleta(true)
                  }}
                  style={{ width: anchoGaleria || '100%' }}
                >
                  <Image
                    source={imagen ? { uri: imagen } : imagenSinProducto}
                    style={estilos.imagen}
                    resizeMode="contain"
                    accessibilityLabel={`${producto.titulo}, foto ${indice + 1}`}
                  />
                </Pressable>
              ))}
            </ScrollView>
            {imagenesProducto.length > 1 && (
              <Text style={estilos.contadorImagen}>{indiceImagen + 1} / {imagenesProducto.length}</Text>
            )}
          </View>
          <View style={estilos.detalles}>
            {!!producto.categoria && (
              <Text style={estilos.categoria}>{producto.categoria}</Text>
            )}
            <Text style={estilos.titulo}>{producto.titulo}</Text>
            {producto.enOferta && <Text style={estilos.etiquetaOferta}>OFERTA</Text>}
            {tieneDescuento && (
              <Text style={estilos.precioAnterior}>{formatearPrecio(precioRegular)}</Text>
            )}
            {isAdmin && mostrarPreciosAdmin && (
              <View style={estilos.detallesAdmin}>
                <Text style={estilos.precioProveedor}>
                  Proveedor: {formatearPrecio(precioProveedor)}
                </Text>
                <Text style={estilos.ganancia}>
                  Ganancia: {formatearPrecio(ganancia)}
                </Text>
              </View>
            )}
            <Text style={estilos.precio}>{formatearPrecio(precio)}</Text>
            <Text style={estilos.nota}>
              Consultá disponibilidad y coordiná tu compra por WhatsApp.
            </Text>
            {isAdmin && (
              <View style={estilos.accionesAdmin}>
                <Boton
                  titulo="Editar producto"
                  variante="secundario"
                  onPress={() => navigation.navigate('AdminProducto', { producto })}
                />
                <Boton
                  titulo="Eliminar producto"
                  variante="peligro"
                  cargando={eliminando}
                  deshabilitado={eliminando}
                  onPress={solicitarEliminacion}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={[estilos.acciones, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={estilos.botonAccion}>
          <Boton
            titulo="Agregar"
            onPress={() => {
              agregarAlCarrito(producto)
              navigation.popTo('Principal', { screen: 'Carrito' })
            }}
          />
        </View>
        <View style={estilos.botonAccion}>
          <Boton titulo="Volver" variante="secundario" onPress={() => navigation.goBack()} />
        </View>
      </View>
      <Modal
        visible={mostrarImagenCompleta}
        animationType="none"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setMostrarImagenCompleta(false)}
      >
        <View style={estilos.imagenCompleta}>
          <View style={[estilos.areaImagenCompleta, { marginTop: insets.top }]}>
            <ImagenProductoZoom
              source={imagenSeleccionada ? { uri: imagenSeleccionada } : imagenSinProducto}
              accessibilityLabel={producto.titulo}
            />
          </View>
          <View style={[estilos.accionesImagen, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Boton
              titulo="Volver"
              variante="secundario"
              onPress={() => setMostrarImagenCompleta(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { flexGrow: 1, padding: 18, paddingBottom: 24, backgroundColor: colores.fondo },
    estado: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: colores.fondo },
    botonEstado: { marginTop: 16 },
    tarjeta: {
      overflow: 'hidden',
      borderRadius: 22,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.linea,
    },
    imagen: { width: '100%', height: 310, backgroundColor: colores.superficie },
    contadorImagen: {
      position: 'absolute',
      right: 12,
      bottom: 12,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      color: colores.superficie,
      backgroundColor: 'rgba(17, 24, 39, 0.72)',
      fontSize: 12,
      fontWeight: '700',
    },
    imagenCompleta: { flex: 1, backgroundColor: colores.fondo },
    areaImagenCompleta: { flex: 1 },
    accionesImagen: {
      paddingHorizontal: 18,
      paddingTop: 12,
      backgroundColor: colores.superficie,
      borderTopWidth: 1,
      borderTopColor: colores.linea,
    },
    detalles: { padding: 20, gap: 12 },
    detallesAdmin: { gap: 4 },
    precioProveedor: { color: colores.secundaria, fontSize: 13 },
    ganancia: { color: colores.exito, fontSize: 13, fontWeight: '700' },
    acciones: {
      flexDirection: 'row',
      paddingHorizontal: 18,
      paddingTop: 12,
      gap: 12,
      backgroundColor: colores.superficie,
      borderTopWidth: 1,
      borderTopColor: colores.linea,
    },
    accionesAdmin: { paddingHorizontal: 18, paddingTop: 10 },
    botonAccion: { flex: 1 },
    categoria: { color: colores.secundaria, fontSize: 13, textTransform: 'capitalize' },
    titulo: { color: colores.tinta, fontSize: 23, lineHeight: 30, fontWeight: '800' },
    precio: { color: colores.tinta, fontSize: 27, fontWeight: '800' },
    etiquetaOferta: { color: colores.error, fontSize: 12, fontWeight: '900' },
    precioAnterior: { color: colores.secundaria, fontSize: 14, textDecorationLine: 'line-through' },
    nota: { marginBottom: 4, color: colores.secundaria, fontSize: 14, lineHeight: 21 },
  })
}

function ImagenProductoZoom({ source, accessibilityLabel }) {
  const eventTargetRef = useRef(null)
  const escala = useRef(new Animated.Value(1)).current
  const desplazamientoX = useRef(new Animated.Value(0)).current
  const desplazamientoY = useRef(new Animated.Value(0)).current
  const gesto = useRef({
    modo: 'inactivo',
    escala: 1,
    escalaInicial: 1,
    distanciaInicial: 0,
    x: 0,
    y: 0,
    xInicial: 0,
    yInicial: 0,
    ancho: 0,
    alto: 0,
    anchoImagen: 0,
    altoImagen: 0,
    izquierda: 0,
    arriba: 0,
    toqueInicial: null,
    ultimoToque: null,
  }).current

  const limitarDesplazamiento = (x, y, nuevaEscala) => {
    const anchoAjustado = Math.min(
      gesto.ancho / gesto.anchoImagen || 0,
      gesto.alto / gesto.altoImagen || 0,
    )
    const ancho = gesto.anchoImagen * anchoAjustado * nuevaEscala
    const alto = gesto.altoImagen * anchoAjustado * nuevaEscala
    const limiteX = Math.max(0, (ancho - gesto.ancho) / 2)
    const limiteY = Math.max(0, (alto - gesto.alto) / 2)
    return {
      x: Math.max(-limiteX, Math.min(limiteX, x)),
      y: Math.max(-limiteY, Math.min(limiteY, y)),
    }
  }

  const aplicarTransformacion = (nuevaEscala, x, y) => {
    const escalaLimitada = Math.max(1, Math.min(4, nuevaEscala))
    const desplazamiento = escalaLimitada === 1
      ? { x: 0, y: 0 }
      : limitarDesplazamiento(x, y, escalaLimitada)
    gesto.escala = escalaLimitada
    gesto.x = desplazamiento.x
    gesto.y = desplazamiento.y
    escala.setValue(escalaLimitada)
    desplazamientoX.setValue(desplazamiento.x)
    desplazamientoY.setValue(desplazamiento.y)
  }

  const iniciarArrastre = (touch) => {
    gesto.modo = 'arrastre'
    gesto.xInicial = touch.pageX
    gesto.yInicial = touch.pageY
  }

  const manejarInicioToque = (event) => {
    const { touches } = event.nativeEvent
    if (touches.length >= 2) {
      gesto.toqueInicial = null
      const [primero, segundo] = touches
      gesto.modo = 'zoom'
      gesto.distanciaInicial = Math.hypot(
        segundo.pageX - primero.pageX,
        segundo.pageY - primero.pageY,
      )
      gesto.escalaInicial = gesto.escala
    } else if (touches.length === 1 && gesto.escala > 1) {
      gesto.toqueInicial = {
        x: touches[0].pageX,
        y: touches[0].pageY,
        tiempo: Date.now(),
      }
      iniciarArrastre(touches[0])
    } else if (touches.length === 1) {
      gesto.toqueInicial = {
        x: touches[0].pageX,
        y: touches[0].pageY,
        tiempo: Date.now(),
      }
    }
  }

  const alternarZoomEnPunto = (touch) => {
    if (gesto.escala > 1) {
      aplicarTransformacion(1, 0, 0)
      return
    }
    const escalaDobleToque = 2.5
    const x = touch.pageX - gesto.izquierda - gesto.ancho / 2
    const y = touch.pageY - gesto.arriba - gesto.alto / 2
    aplicarTransformacion(escalaDobleToque, -x * (escalaDobleToque - 1), -y * (escalaDobleToque - 1))
  }

  const manejarToqueCompleto = (event) => {
    const inicio = gesto.toqueInicial
    const touch = event.nativeEvent.changedTouches?.[0]
    gesto.toqueInicial = null
    if (
      !inicio
      || !touch
      || Date.now() - inicio.tiempo > 300
      || Math.hypot(touch.pageX - inicio.x, touch.pageY - inicio.y) > 18
    ) return

    const ultimo = gesto.ultimoToque
    if (
      ultimo
      && Date.now() - ultimo.tiempo <= 350
      && Math.hypot(touch.pageX - ultimo.x, touch.pageY - ultimo.y) <= 32
    ) {
      gesto.ultimoToque = null
      alternarZoomEnPunto(touch)
    } else {
      gesto.ultimoToque = { x: touch.pageX, y: touch.pageY, tiempo: Date.now() }
    }
  }

  const manejarMovimientoToque = (event) => {
    const { touches } = event.nativeEvent
    if (gesto.modo === 'zoom' && touches.length >= 2) {
      const [primero, segundo] = touches
      const distancia = Math.hypot(
        segundo.pageX - primero.pageX,
        segundo.pageY - primero.pageY,
      )
      if (gesto.distanciaInicial > 0) {
        aplicarTransformacion(
          gesto.escalaInicial * distancia / gesto.distanciaInicial,
          gesto.x,
          gesto.y,
        )
      }
    } else if (gesto.modo === 'arrastre' && touches.length === 1) {
      const touch = touches[0]
      aplicarTransformacion(
        gesto.escala,
        gesto.x + touch.pageX - gesto.xInicial,
        gesto.y + touch.pageY - gesto.yInicial,
      )
      gesto.xInicial = touch.pageX
      gesto.yInicial = touch.pageY
    }
  }

  const manejarFinToque = (event) => {
    const { touches } = event.nativeEvent
    if (touches.length >= 2) {
      gesto.toqueInicial = null
      manejarInicioToque(event)
    } else if (touches.length === 1 && gesto.escala > 1) {
      gesto.toqueInicial = null
      iniciarArrastre(touches[0])
    } else {
      gesto.modo = 'inactivo'
      manejarToqueCompleto(event)
    }
  }

  return (
    <View
      style={estilosZoom.area}
      onLayout={({ nativeEvent }) => {
        gesto.ancho = nativeEvent.layout.width
        gesto.alto = nativeEvent.layout.height
        eventTargetRef.current?.measureInWindow((izquierda, arriba) => {
          gesto.izquierda = izquierda
          gesto.arriba = arriba
        })
      }}
      onTouchStart={manejarInicioToque}
      onTouchMove={manejarMovimientoToque}
      onTouchEnd={manejarFinToque}
      onTouchCancel={manejarFinToque}
      ref={eventTargetRef}
    >
      <Animated.Image
        source={source}
        style={[
          estilosZoom.imagen,
          {
            transform: [
              { translateX: desplazamientoX },
              { translateY: desplazamientoY },
              { scale: escala },
            ],
          },
        ]}
        resizeMode="contain"
        accessibilityLabel={accessibilityLabel}
        onLoad={({ nativeEvent }) => {
          gesto.anchoImagen = nativeEvent.source.width
          gesto.altoImagen = nativeEvent.source.height
        }}
      />
    </View>
  )
}

const estilosZoom = StyleSheet.create({
  area: { flex: 1, overflow: 'hidden' },
  imagen: { width: '100%', height: '100%' },
})
