import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  FlatList,
  Image,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Encabezado from '../components/Encabezado'
import TarjetaProducto from '../components/TarjetaProducto'
import { Cargando, Mensaje } from '../components/Controles'
import { obtenerErrorApi } from '../api/client'
import { useAccionesCarrito } from '../context/CarritoContext'
import { useCatalogo } from '../context/CatalogoContext'
import { useTema } from '../context/TemaContext'
import { obtenerPrecioFinal } from '../utils/precios'
import { useAuth } from '../context/AuthContext'
import {
  guardarConfiguracionProductos,
  obtenerConfiguracionProductos,
} from '../api/administracionProductos'

const CLAVE_PREFERENCIAS_TIENDA = 'alebourg-preferencias-tienda'
const ORDEN_SIN_ORDENAR = 'original'
const ORDEN_MENOR_PRECIO = 'asc'
const ORDEN_MAYOR_PRECIO = 'desc'
const etiquetasOrden = {
  [ORDEN_SIN_ORDENAR]: 'Sin ordenar',
  [ORDEN_MENOR_PRECIO]: 'Menor Precio',
  [ORDEN_MAYOR_PRECIO]: 'Mayor Precio',
}

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export default function TiendaScreen({ navigation }) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const {
    productos,
    categorias,
    configuracionPrecios,
    productosDestacados,
    cargarCatalogo,
  } = useCatalogo()
  const { isAdmin } = useAuth()
  const { agregarAlCarrito } = useAccionesCarrito()
  const listaRef = useRef(null)
  const [cantidadColumnas, setCantidadColumnas] = useState(2)
  const [ordenPrecio, setOrdenPrecio] = useState(ORDEN_SIN_ORDENAR)
  const [preferenciasCargadas, setPreferenciasCargadas] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState(false)
  const [mostrarVolverArriba, setMostrarVolverArriba] = useState(false)
  const [configuracionAdmin, setConfiguracionAdmin] = useState(null)
  const [guardandoOrden, setGuardandoOrden] = useState(false)
  const posicionesProductos = useRef(new Map())
  const arrastreActual = useRef({ id: null, destinoId: null })
  const moverProductoRef = useRef(null)

  const volverAlBuscador = useCallback(() => {
    listaRef.current?.scrollToOffset({ offset: 0, animated: true })
  }, [])

  const manejarScroll = useCallback((evento) => {
    const posicion = Math.max(0, evento.nativeEvent.contentOffset.y)
    const debeMostrar = posicion > 600
    setMostrarVolverArriba((visible) => (
      visible === debeMostrar ? visible : debeMostrar
    ))
  }, [])

  useEffect(() => {
    let activo = true
    AsyncStorage.getItem(CLAVE_PREFERENCIAS_TIENDA)
      .then((guardado) => {
        if (!activo || !guardado) return
        const preferencias = JSON.parse(guardado)
        if (preferencias.columnas === 1 || preferencias.columnas === 2) {
          setCantidadColumnas(preferencias.columnas)
        }
        if ([ORDEN_SIN_ORDENAR, ORDEN_MENOR_PRECIO, ORDEN_MAYOR_PRECIO].includes(preferencias.ordenPrecio)) {
          setOrdenPrecio(preferencias.ordenPrecio)
        }
      })
      .catch((errorPreferencias) => {
        console.error('No se pudieron cargar las preferencias de la tienda:', errorPreferencias)
      })
      .finally(() => { if (activo) setPreferenciasCargadas(true) })
    return () => { activo = false }
  }, [])

  useEffect(() => {
    if (!preferenciasCargadas) return
    AsyncStorage.setItem(CLAVE_PREFERENCIAS_TIENDA, JSON.stringify({
      columnas: cantidadColumnas,
      ordenPrecio,
    })).catch((errorPreferencias) => {
      console.error('No se pudieron guardar las preferencias de la tienda:', errorPreferencias)
    })
  }, [cantidadColumnas, ordenPrecio, preferenciasCargadas])

  const recargar = useCallback(async (esActualizacion = false) => {
    if (esActualizacion) setActualizando(true)
    else setCargando(true)
    setError('')
    try {
      await cargarCatalogo()
    } catch (errorCarga) {
      setError(obtenerErrorApi(errorCarga, 'No se pudo cargar la tienda.'))
    } finally {
      setCargando(false)
      setActualizando(false)
    }
  }, [cargarCatalogo])

  useEffect(() => { recargar() }, [recargar])

  useEffect(() => {
    if (!isAdmin) {
      setConfiguracionAdmin(null)
      return
    }
    let activo = true
    obtenerConfiguracionProductos()
      .then((configuracion) => { if (activo) setConfiguracionAdmin(configuracion) })
      .catch((errorConfiguracion) => {
        console.error('No se pudo cargar el orden de productos:', errorConfiguracion)
      })
    return () => { activo = false }
  }, [isAdmin])

  const categoriasVisibles = useMemo(() => (
    categorias
      .filter((categoria) => categoria?.nombreOriginal)
      .map((categoria) => ({
        nombreOriginal: String(categoria.nombreOriginal),
        nombre: String(categoria.nombre || categoria.nombreOriginal),
      }))
  ), [categorias])

  const productosFiltrados = useMemo(() => {
    const texto = normalizar(busqueda)
    const filtrados = productos.filter((producto) => (
      (!categoriaSeleccionada
        || normalizar(producto.categoria) === normalizar(categoriaSeleccionada))
      && (!texto || normalizar(`${producto.titulo} ${producto.categoria}`).includes(texto))
    ))
    if (ordenPrecio === ORDEN_SIN_ORDENAR || !configuracionPrecios) return filtrados

    return filtrados
      .map((producto, indiceOriginal) => ({
        producto,
        indiceOriginal,
        precio: obtenerPrecioFinal(producto, configuracionPrecios),
      }))
      .sort((a, b) => (
        (ordenPrecio === ORDEN_MENOR_PRECIO ? a.precio - b.precio : b.precio - a.precio)
        || a.indiceOriginal - b.indiceOriginal
      ))
      .map(({ producto }) => producto)
  }, [productos, categoriaSeleccionada, busqueda, ordenPrecio, configuracionPrecios])

  const listaCategorias = [{ nombreOriginal: '', nombre: 'Todos' }, ...categoriasVisibles]
  const abrirDetalle = useCallback((producto) => {
    navigation.navigate('DetalleProducto', { productoId: producto.id })
  }, [navigation])
  const agregarProducto = useCallback((producto) => {
    agregarAlCarrito(producto)
  }, [agregarAlCarrito])
  const moverProductoAlLugar = useCallback(async (id, destinoId) => {
    if (!configuracionAdmin || guardandoOrden) return
    const ordenBase = configuracionAdmin.orden.length
      ? [...configuracionAdmin.orden]
      : productos.map((producto) => producto.id)
    const ordenActual = [
      ...ordenBase,
      ...productos.map((producto) => producto.id).filter((productoId) => !ordenBase.includes(productoId)),
    ]
    const indice = ordenActual.indexOf(id)
    const destino = ordenActual.indexOf(destinoId)
    if (indice < 0 || destino < 0 || destino >= ordenActual.length || indice === destino) return
    ordenActual.splice(destino, 0, ordenActual.splice(indice, 1)[0])
    setGuardandoOrden(true)
    try {
      const actualizada = await guardarConfiguracionProductos({
        ...configuracionAdmin,
        orden: ordenActual,
        ordenPersonalizadoActivo: true,
      })
      setConfiguracionAdmin(actualizada)
      await cargarCatalogo()
    } catch (errorOrden) {
      Alert.alert('No se pudo guardar el orden', obtenerErrorApi(errorOrden, 'Intentá de nuevo.'))
    } finally {
      setGuardandoOrden(false)
    }
  }, [configuracionAdmin, guardandoOrden, productos, cargarCatalogo])
  moverProductoRef.current = moverProductoAlLugar

  const moverProducto = useCallback((id, desplazamiento) => {
    const ordenBase = configuracionAdmin?.orden.length
      ? configuracionAdmin.orden
      : productos.map((producto) => producto.id)
    const ordenActual = [
      ...ordenBase,
      ...productos.map((producto) => producto.id).filter((productoId) => !ordenBase.includes(productoId)),
    ]
    const indice = ordenActual.indexOf(id)
    const destinoId = ordenActual[indice + desplazamiento]
    if (destinoId !== undefined) moverProductoAlLugar(id, destinoId)
  }, [configuracionAdmin, productos, moverProductoAlLugar])

  function crearControlArrastre(productoId) {
    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesto) => (
        Boolean(configuracionAdmin?.ordenPersonalizadoActivo)
        && ordenPrecio === ORDEN_SIN_ORDENAR
        && !busqueda
        && !categoriaSeleccionada
        && (Math.abs(gesto.dx) > 5 || Math.abs(gesto.dy) > 5)
      ),
      onPanResponderGrant: () => {
        arrastreActual.current = { id: productoId, destinoId: productoId }
        posicionesProductos.current.forEach((posicion, id) => {
          posicion.ref?.measureInWindow?.((x, y, width, height) => {
            posicionesProductos.current.set(id, { ...posicion, x, y, width, height })
          })
        })
      },
      onPanResponderMove: (_, gesto) => {
        for (const [id, posicion] of posicionesProductos.current.entries()) {
          if (
            typeof posicion.x === 'number'
            && gesto.moveX >= posicion.x
            && gesto.moveX <= posicion.x + posicion.width
            && gesto.moveY >= posicion.y
            && gesto.moveY <= posicion.y + posicion.height
          ) {
            arrastreActual.current.destinoId = id
            break
          }
        }
      },
      onPanResponderRelease: () => {
        const { id, destinoId } = arrastreActual.current
        if (id !== null && destinoId !== null) moverProductoRef.current?.(id, destinoId)
        arrastreActual.current = { id: null, destinoId: null }
      },
      onPanResponderTerminate: () => {
        arrastreActual.current = { id: null, destinoId: null }
      },
    })
    return responder.panHandlers
  }

  const renderizarProducto = useCallback(({ item }) => (
    <View
      ref={(referencia) => {
        if (referencia) {
          posicionesProductos.current.set(item.id, {
            ...posicionesProductos.current.get(item.id),
            ref: referencia,
          })
        }
        else posicionesProductos.current.delete(item.id)
      }}
      onLayout={() => {
        const posicion = posicionesProductos.current.get(item.id)
        if (posicion?.ref?.measureInWindow) {
          posicion.ref.measureInWindow((x, y, width, height) => {
            posicionesProductos.current.set(item.id, { ...posicion, x, y, width, height })
          })
        }
      }}
      style={cantidadColumnas === 2 ? estilos.itemProducto : estilos.itemProductoUnaColumna}
    >
      <TarjetaProducto
        producto={item}
        configuracionPrecios={configuracionPrecios}
        compacta={cantidadColumnas === 2}
        centrarContenido={cantidadColumnas === 1}
        alAbrir={abrirDetalle}
        agregarAlCarrito={agregarProducto}
      />
      {isAdmin && configuracionAdmin?.ordenPersonalizadoActivo && ordenPrecio === ORDEN_SIN_ORDENAR
        && !busqueda && !categoriaSeleccionada && (
          <View style={estilos.controlesOrden}>
            <View
              accessibilityRole="button"
              accessibilityLabel={`Arrastrar ${item.titulo} para cambiar su posición`}
              {...crearControlArrastre(item.id)}
              style={estilos.botonOrden}
            >
              <Feather name="move" size={16} color={colores.tinta} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mover ${item.titulo} hacia arriba`}
              disabled={guardandoOrden}
              onPress={() => moverProducto(item.id, -1)}
              style={estilos.botonOrden}
            >
              <Feather name="arrow-up" size={16} color={colores.tinta} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mover ${item.titulo} hacia abajo`}
              disabled={guardandoOrden}
              onPress={() => moverProducto(item.id, 1)}
              style={estilos.botonOrden}
            >
              <Feather name="arrow-down" size={16} color={colores.tinta} />
            </Pressable>
          </View>
        )}
    </View>
  ), [
    cantidadColumnas,
    configuracionPrecios,
    abrirDetalle,
    agregarProducto,
    moverProducto,
    isAdmin,
    configuracionAdmin,
    ordenPrecio,
    busqueda,
    categoriaSeleccionada,
    guardandoOrden,
    colores.tinta,
  ])

  async function moverDestacado(listaId, productoId, desplazamiento) {
    if (!isAdmin || !configuracionAdmin || guardandoOrden) return
    const ids = [...configuracionAdmin[listaId]]
    const indice = ids.indexOf(productoId)
    const destino = indice + desplazamiento
    if (indice < 0 || destino < 0 || destino >= ids.length) return
    ;[ids[indice], ids[destino]] = [ids[destino], ids[indice]]
    setGuardandoOrden(true)
    try {
      const actualizada = await guardarConfiguracionProductos({
        ...configuracionAdmin,
        [listaId]: ids,
      })
      setConfiguracionAdmin(actualizada)
      await cargarCatalogo()
    } catch (errorOrden) {
      Alert.alert('No se pudo guardar el orden', obtenerErrorApi(errorOrden, 'Intentá de nuevo.'))
    } finally {
      setGuardandoOrden(false)
    }
  }

  function renderizarDestacados(titulo, lista, listaId) {
    if (!lista?.length || busqueda || categoriaSeleccionada) return null
    return (
      <View style={estilos.seccionDestacada}>
        <Text style={estilos.tituloDestacados}>{titulo}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.filaDestacados}>
          {lista.map((producto) => {
            const precio = obtenerPrecioFinal(producto, configuracionPrecios)
            const precioNormal = producto.enOferta
              ? obtenerPrecioFinal({ ...producto, precioFinal: null }, configuracionPrecios)
              : precio
            return (
              <View
                key={producto.id}
                style={estilos.tarjetaDestacada}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => abrirDetalle(producto)}
                >
                  <Image
                    source={producto.imagen ? { uri: producto.imagen } : require('../../assets/icon.png')}
                    style={estilos.imagenDestacada}
                    resizeMode="contain"
                  />
                  <Text numberOfLines={2} style={estilos.nombreDestacado}>{producto.titulo}</Text>
                  {producto.enOferta && <Text style={estilos.etiquetaOferta}>OFERTA</Text>}
                  {producto.enOferta && precio < precioNormal && (
                    <Text style={estilos.precioAnterior}>{precioNormal.toLocaleString('es-AR')}</Text>
                  )}
                  <Text style={estilos.precioDestacado}>
                    ${precio.toLocaleString('es-AR')}
                  </Text>
                </Pressable>
                {isAdmin && (
                  <View style={estilos.controlesDestacados}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mover ${producto.titulo} a la izquierda`}
                      disabled={guardandoOrden}
                      onPress={() => moverDestacado(listaId, producto.id, -1)}
                      style={estilos.botonOrden}
                    >
                      <Feather name="arrow-left" size={15} color={colores.tinta} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Mover ${producto.titulo} a la derecha`}
                      disabled={guardandoOrden}
                      onPress={() => moverDestacado(listaId, producto.id, 1)}
                      style={estilos.botonOrden}
                    >
                      <Feather name="arrow-right" size={15} color={colores.tinta} />
                    </Pressable>
                  </View>
                )}
              </View>
            )
          })}
        </ScrollView>
      </View>
    )
  }

  const encabezadoLista = (
    <View>
      <View>
        <Encabezado
          navigation={navigation}
          titulo={'Encontrá\nlo que buscás'}
          subtitulo="📍 Malvinas Argentinas"
          centrarTitulo
        />
      </View>
      {renderizarDestacados('Más vendidos', productosDestacados.masVendidos, 'masVendidos')}
      {renderizarDestacados('Ofertas', productosDestacados.ofertas, 'ofertas')}
      <View style={estilos.busqueda}>
        <Feather name="search" size={18} color={colores.secundaria} />
        <TextInput
          accessibilityLabel="Buscar productos"
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar productos"
          placeholderTextColor={colores.secundaria}
          returnKeyType="search"
          style={estilos.campoBusqueda}
        />
        {!!busqueda && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={() => setBusqueda('')}
            hitSlop={8}
          >
            <Feather name="x-circle" size={18} color={colores.error} />
          </Pressable>
        )}
      </View>
      <FlatList
        horizontal
        data={listaCategorias}
        keyExtractor={(item) => item.nombreOriginal || 'todas'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.categorias}
        renderItem={({ item }) => {
          const seleccionada = categoriaSeleccionada === item.nombreOriginal
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: seleccionada }}
              onPress={() => setCategoriaSeleccionada(item.nombreOriginal)}
              style={[estilos.chip, seleccionada && estilos.chipSeleccionado]}
            >
              <Text style={[estilos.textoChip, seleccionada && estilos.textoChipSeleccionado]}>
                {item.nombre}
              </Text>
            </Pressable>
          )
        }}
      />
      <View style={estilos.opcionesLista}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Orden actual: ${etiquetasOrden[ordenPrecio]}. Tocar para cambiar`}
          onPress={() => {
            const opciones = [
            { text: 'Menor Precio', onPress: () => setOrdenPrecio(ORDEN_MENOR_PRECIO) },
            { text: 'Mayor Precio', onPress: () => setOrdenPrecio(ORDEN_MAYOR_PRECIO) },
            { text: 'Sin ordenar', onPress: () => setOrdenPrecio(ORDEN_SIN_ORDENAR) },
            ]
            Alert.alert(
              'Ordenar por precio',
              'Elegí cómo ordenar los productos:',
              Platform.OS === 'android' ? opciones.reverse() : opciones,
              { cancelable: true },
            )
          }}
          style={estilos.selectorOrden}
        >
          <Feather name="sliders" size={16} color={colores.primario} />
          <Text style={estilos.textoSelectorOrden}>{etiquetasOrden[ordenPrecio]}</Text>
          <Feather name="chevron-down" size={16} color={colores.primario} />
        </Pressable>
        <View style={estilos.selectorColumnas}>
          {[1, 2].map((columnas) => {
            const seleccionada = cantidadColumnas === columnas
            return (
              <Pressable
                key={columnas}
                accessibilityRole="button"
                accessibilityLabel={`Ver productos en ${columnas} columna${columnas === 1 ? '' : 's'}`}
                accessibilityState={{ selected: seleccionada }}
                onPress={() => setCantidadColumnas(columnas)}
                style={[estilos.botonColumnas, seleccionada && estilos.botonColumnasSeleccionado]}
              >
                <Feather
                  name={columnas === 1 ? 'list' : 'grid'}
                  size={18}
                  color={seleccionada ? colores.tinta : colores.secundaria}
                />
              </Pressable>
            )
          })}
        </View>
      </View>
      {!!error && (
        <View style={estilos.avisoError}>
          <Mensaje titulo="No se pudo actualizar la tienda" detalle={error} tipo="error" />
          <Pressable
            accessibilityRole="button"
            onPress={() => recargar()}
            style={estilos.reintentar}
          >
            <Text style={estilos.textoReintentar}>Reintentar</Text>
          </Pressable>
        </View>
      )}
      {!cargando && !error && (
        <Text style={estilos.resultados}>
          {productosFiltrados.length === 1
            ? '1 producto'
            : `${productosFiltrados.length} productos`}
        </Text>
      )}
    </View>
  )

  return (
    <View style={estilos.contenedor}>
      <FlatList
        ref={listaRef}
        key={cantidadColumnas}
        style={estilos.pantalla}
        data={productosFiltrados}
        numColumns={cantidadColumnas}
        columnWrapperStyle={cantidadColumnas > 1 ? estilos.filaProductos : undefined}
        keyExtractor={(producto) => String(producto.id)}
        renderItem={renderizarProducto}
        ListHeaderComponent={encabezadoLista}
        ListEmptyComponent={cargando
          ? <Cargando mensaje="Cargando productos..." />
          : !error && (
            <Mensaje
              titulo="No encontramos productos"
              detalle={productos.length
                ? 'Probá con otra búsqueda o categoría.'
                : 'Volvé más tarde para ver las novedades.'}
            />
          )}
        contentContainerStyle={estilos.lista}
        ItemSeparatorComponent={() => <View style={estilos.separador} />}
        refreshControl={(
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => recargar(true)}
            tintColor={colores.primarioOscuro}
          />
        )}
        onScroll={manejarScroll}
        scrollEventThrottle={200}
        keyboardShouldPersistTaps="handled"
      />
      {mostrarVolverArriba && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio de la tienda"
          onPress={volverAlBuscador}
          style={({ pressed }) => [
            estilos.botonVolverArriba,
            pressed && estilos.botonVolverArribaPresionado,
          ]}
        >
          <Feather name="arrow-up" size={18} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
  contenedor: { flex: 1 },
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  lista: { paddingBottom: 28, paddingHorizontal: 16 },
  filaProductos: { gap: 10 },
  itemProducto: { flex: 1, aspectRatio: 175 / 275 },
  itemProductoUnaColumna: { width: '100%', minHeight: 440 },
  botonVolverArriba: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(55, 65, 81, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  botonVolverArribaPresionado: { opacity: 0.75 },
  seccionDestacada: { marginHorizontal: 4, marginBottom: 8, gap: 8 },
  tituloDestacados: { color: colores.tinta, fontSize: 18, fontWeight: '800' },
  filaDestacados: { gap: 10, paddingVertical: 2 },
  tarjetaDestacada: {
    width: 145,
    padding: 9,
    borderRadius: 14,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.linea,
  },
  controlesDestacados: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 6,
  },
  imagenDestacada: { width: '100%', height: 95 },
  nombreDestacado: { minHeight: 36, marginTop: 5, color: colores.tinta, fontSize: 12, fontWeight: '600' },
  precioDestacado: { marginTop: 4, color: colores.primarioOscuro, fontSize: 14, fontWeight: '800' },
  etiquetaOferta: { marginTop: 4, color: colores.error, fontSize: 10, fontWeight: '900' },
  precioAnterior: { color: colores.secundaria, fontSize: 10, textDecorationLine: 'line-through' },
  controlesOrden: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 2,
    gap: 3,
  },
  botonOrden: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.linea,
  },
  opcionesLista: {
    marginHorizontal: 4,
    marginTop: 12,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorOrden: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.linea,
    backgroundColor: colores.superficie,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  textoSelectorOrden: { flex: 1, color: colores.tinta, fontSize: 13, fontWeight: '600' },
  selectorColumnas: {
    height: 40,
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.linea,
    backgroundColor: colores.superficie,
    flexDirection: 'row',
    gap: 3,
  },
  botonColumnas: {
    width: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonColumnasSeleccionado: { backgroundColor: colores.primarioClaro },
  busqueda: {
    minHeight: 50,
    marginHorizontal: 4,
    marginBottom: 12,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.linea,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  campoBusqueda: { flex: 1, color: colores.tinta, paddingVertical: 11, fontSize: 15 },
  categorias: { paddingHorizontal: 4, paddingVertical: 8, gap: 8 },
  chip: {
    minHeight: 37,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSeleccionado: { backgroundColor: colores.cta, borderColor: colores.cta },
  textoChip: { color: colores.secundaria, fontSize: 13, fontWeight: '700' },
  textoChipSeleccionado: { color: colores.tinta },
  avisoError: { marginHorizontal: 4, marginTop: 8, gap: 8 },
  reintentar: { alignSelf: 'flex-start', paddingHorizontal: 4, paddingVertical: 6 },
  textoReintentar: { color: colores.primarioOscuro, fontSize: 14, fontWeight: '800' },
  resultados: { paddingHorizontal: 4, paddingTop: 10, paddingBottom: 8, color: colores.secundaria, fontSize: 13 },
  separador: { height: 14 },
  })
}
