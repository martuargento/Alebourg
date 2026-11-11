import { useEffect, useState } from 'react'
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Feather } from '@expo/vector-icons'
import { Boton, Cargando } from '../components/Controles'
import {
  crearProductoManual,
  eliminarProducto,
  guardarConfiguracionProductos,
  guardarEdicionProducto,
  marcarProductoRevisado,
  obtenerConfiguracionProductos,
  subirImagenProducto,
} from '../api/administracionProductos'
import {
  guardarRitmoCarruselProducto,
  obtenerConfiguracionCarrusel,
} from '../api/configuracion'
import { obtenerErrorApi } from '../api/client'
import { useCatalogo } from '../context/CatalogoContext'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/TemaContext'

export default function AdminProductoScreen({ route, navigation }) {
  const productoInicial = route.params?.producto || null
  const esNuevo = !productoInicial
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const { cargarCatalogo } = useCatalogo()
  const { isAdmin, cargandoSesion } = useAuth()
  const [esProductoNuevo, setEsProductoNuevo] = useState(esNuevo)
  const [productoId, setProductoId] = useState(productoInicial?.id ?? null)
  const [titulo, setTitulo] = useState(productoInicial?.titulo || '')
  const [categoria, setCategoria] = useState(productoInicial?.categoria || '')
  const [precioProveedor, setPrecioProveedor] = useState(productoInicial?.precio || '')
  const [precioFinal, setPrecioFinal] = useState(productoInicial?.precioFinal || '')
  const [imagenes, setImagenes] = useState(productoInicial?.imagenes || [])
  const [configuracionCarrusel, setConfiguracionCarrusel] = useState(null)
  const [intervaloFotoPropio, setIntervaloFotoPropio] = useState('')
  const [pendienteRevision, setPendienteRevision] = useState(Boolean(productoInicial?.pendienteRevision))
  const [masVendido, setMasVendido] = useState(false)
  const [oferta, setOferta] = useState(false)
  const [configuracion, setConfiguracion] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    obtenerConfiguracionProductos()
      .then((valor) => {
        if (!activo) return
        setConfiguracion(valor)
        setMasVendido(valor.masVendidos.includes(productoInicial?.id))
        setOferta(valor.ofertas.includes(productoInicial?.id))
      })
      .catch((errorCarga) => {
        if (activo) setError(obtenerErrorApi(errorCarga, 'No se pudo cargar la configuración de productos.'))
      })
      .finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [productoInicial?.id])

  useEffect(() => {
    let activo = true
    obtenerConfiguracionCarrusel()
      .then((valor) => {
        if (!activo) return
        setConfiguracionCarrusel(valor)
        setIntervaloFotoPropio(String(valor.productIntervals[String(productoInicial?.id)] ?? ''))
      })
      .catch((errorConfiguracion) => {
        if (activo) {
          setError(obtenerErrorApi(errorConfiguracion, 'No se pudo cargar el ritmo de las fotos.'))
        }
      })
    return () => { activo = false }
  }, [productoInicial?.id])

  async function seleccionarImagenes() {
    setError('')
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
        orderedSelection: true,
      })
      if (resultado.canceled) return
      if (!productoId) {
        Alert.alert('Guardá el producto primero', 'Después vas a poder agregarle fotos desde el celular.')
        return
      }
      if (imagenes.length + resultado.assets.length > 12) {
        Alert.alert('Máximo de fotos', 'Cada producto admite hasta 12 imágenes.')
        return
      }
      if (resultado.assets.some((archivo) => archivo.fileSize > 4 * 1024 * 1024)) {
        Alert.alert('Imagen demasiado grande', 'Cada imagen debe pesar 4 MB o menos.')
        return
      }
      setGuardando(true)
      const subidas = []
      for (const archivo of resultado.assets) {
        subidas.push(await subirImagenProducto(productoId, archivo))
      }
      setImagenes((actuales) => [...actuales, ...subidas])
    } catch (errorCarga) {
      setError(obtenerErrorApi(errorCarga, 'No se pudieron subir las imágenes.'))
    } finally {
      setGuardando(false)
    }
  }

  function moverImagen(indice, desplazamiento) {
    setImagenes((actuales) => {
      const destino = indice + desplazamiento
      if (destino < 0 || destino >= actuales.length) return actuales
      const reordenadas = [...actuales]
      ;[reordenadas[indice], reordenadas[destino]] = [reordenadas[destino], reordenadas[indice]]
      return reordenadas
    })
  }

  async function guardar() {
    setError('')
    const intervaloPropio = intervaloFotoPropio.trim() === ''
      ? null
      : Number(intervaloFotoPropio)
    if (
      configuracionCarrusel?.mode === 'individual'
      && intervaloPropio !== null
      && (!Number.isInteger(intervaloPropio) || intervaloPropio < 2 || intervaloPropio > 60)
    ) {
      setError('El ritmo propio debe ser un número entero entre 2 y 60 segundos.')
      return
    }
    setGuardando(true)
    try {
      const datos = {
        titulo: titulo.trim(),
        categoria: categoria.trim(),
        precioProveedor,
        precioFinal: precioFinal.trim() || null,
        imagenes,
      }
      let id = productoId
      if (!id) {
        const nuevo = await crearProductoManual({
          ...datos,
          precioFinal: precioFinal.trim() || precioProveedor || '0',
          imagenes: [],
        })
        id = nuevo.id
        setProductoId(id)
        setEsProductoNuevo(false)
      }
      const actualizado = await guardarEdicionProducto(id, datos)
      if (configuracionCarrusel?.mode === 'individual') {
        const configuracionActualizada = await guardarRitmoCarruselProducto(id, intervaloPropio)
        setConfiguracionCarrusel(configuracionActualizada)
      }
      const base = configuracion || await obtenerConfiguracionProductos()
      const nuevoConfig = {
        ...base,
        masVendidos: masVendido
          ? [...new Set([...base.masVendidos, id])]
          : base.masVendidos.filter((item) => item !== id),
        ofertas: oferta
          ? [...new Set([...base.ofertas, id])]
          : base.ofertas.filter((item) => item !== id),
        orden: base.ordenPersonalizadoActivo
          ? [...new Set([...base.orden, id])]
          : base.orden,
      }
      await guardarConfiguracionProductos(nuevoConfig)
      setConfiguracion(nuevoConfig)
      await cargarCatalogo()
      if (actualizado.id !== productoId) navigation.setParams({ producto: actualizado })
      if (esProductoNuevo) {
        Alert.alert('Producto guardado', 'Los cambios ya están guardados en la base de datos.')
      } else {
        navigation.popTo('Principal', { screen: 'Tienda' })
      }
    } catch (errorGuardar) {
      setError(obtenerErrorApi(errorGuardar, 'No se pudo guardar el producto.'))
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarRevision() {
    try {
      await marcarProductoRevisado(productoId)
      setPendienteRevision(false)
      await cargarCatalogo()
    } catch (errorRevision) {
      setError(obtenerErrorApi(errorRevision, 'No se pudo confirmar la revisión.'))
    }
  }

  function solicitarEliminacion() {
    Alert.alert(
      'Eliminar producto',
      'Se eliminará el producto y sus personalizaciones actuales de la base de datos. Si vuelve a aparecer en una importación futura, se podrá cargar nuevamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setGuardando(true)
            setError('')
            try {
              await eliminarProducto(productoId)
              await cargarCatalogo()
              navigation.navigate('Principal', { screen: 'Tienda' })
            } catch (errorArchivo) {
              setError(obtenerErrorApi(errorArchivo, 'No se pudo eliminar el producto.'))
            } finally {
              setGuardando(false)
            }
          },
        },
      ],
    )
  }

  if (cargando || cargandoSesion) return <Cargando mensaje="Cargando edición..." />
  if (!isAdmin) {
    return (
      <View style={[estilos.pantalla, estilos.sinAcceso]}>
        <Text style={estilos.error}>Iniciá sesión como administrador para editar productos.</Text>
        <Boton titulo="Volver" variante="secundario" onPress={() => navigation.goBack()} />
      </View>
    )
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Text style={estilos.titulo}>{esProductoNuevo ? 'Agregar producto' : 'Editar producto'}</Text>
      {!!error && <Text style={estilos.error}>{error}</Text>}
      {pendienteRevision && (
        <View style={estilos.revision}>
          <Text style={estilos.revisionTitulo}>Hay datos nuevos del catálogo para revisar</Text>
          <Text style={estilos.descripcion}>
            Tus cambios se conservaron. El catálogo importado ahora informa:
          </Text>
          <Text style={estilos.descripcion}>
            Título: {productoInicial?.datosImportados?.titulo || '—'}{'\n'}
            Costo: {productoInicial?.datosImportados?.precio || '—'}{'\n'}
            Categoría: {productoInicial?.datosImportados?.categoria || '—'}
          </Text>
          <Boton titulo="Marcar revisión como hecha" variante="secundario" onPress={confirmarRevision} />
        </View>
      )}
      <Campo titulo="Título" valor={titulo} cambiar={setTitulo} estilos={estilos} />
      <Campo titulo="Categoría" valor={categoria} cambiar={setCategoria} estilos={estilos} />
      <Campo
        titulo="Costo del proveedor"
        valor={precioProveedor}
        cambiar={setPrecioProveedor}
        estilos={estilos}
        teclado="decimal-pad"
      />
      <Campo
        titulo="Precio final o promocional (vacío usa los rangos)"
        valor={precioFinal}
        cambiar={setPrecioFinal}
        estilos={estilos}
        teclado="decimal-pad"
      />
      {configuracionCarrusel?.mode === 'individual' && (
        <View style={estilos.campo}>
          <Campo
            titulo="Ritmo propio de fotos (segundos)"
            valor={intervaloFotoPropio}
            cambiar={(valor) => setIntervaloFotoPropio(valor.replace(/\D/g, ''))}
            estilos={estilos}
            teclado="number-pad"
          />
          <Text style={estilos.descripcion}>
            Dejá vacío para usar el intervalo global de {configuracionCarrusel.intervalSeconds} segundos.
          </Text>
        </View>
      )}
      <View style={estilos.tarjeta}>
        <Text style={estilos.subtitulo}>Fotos ({imagenes.length}/12)</Text>
        <Text style={estilos.descripcion}>Usá las flechas para cambiar el orden de las fotos.</Text>
        <ScrollView horizontal contentContainerStyle={estilos.galeria}>
          {imagenes.map((url, indice) => (
            <View key={`${url}-${indice}`} style={estilos.fotoContenedor}>
              <Image source={{ uri: url }} style={estilos.foto} />
              <View style={estilos.controlesFoto}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mover foto ${indice + 1} a la izquierda`}
                  disabled={indice === 0 || guardando}
                  style={[estilos.botonOrdenFoto, (indice === 0 || guardando) && estilos.botonFotoDeshabilitado]}
                  onPress={() => moverImagen(indice, -1)}
                >
                  <Feather name="arrow-left" size={15} color={colores.superficie} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar foto ${indice + 1}`}
                  disabled={guardando}
                  style={estilos.botonFoto}
                  onPress={() => setImagenes((actuales) => actuales.filter((_, posicion) => posicion !== indice))}
                >
                  <Feather name="x" size={15} color={colores.superficie} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mover foto ${indice + 1} a la derecha`}
                  disabled={indice === imagenes.length - 1 || guardando}
                  style={[
                    estilos.botonOrdenFoto,
                    (indice === imagenes.length - 1 || guardando) && estilos.botonFotoDeshabilitado,
                  ]}
                  onPress={() => moverImagen(indice, 1)}
                >
                  <Feather name="arrow-right" size={15} color={colores.superficie} />
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
        <Boton
          titulo={guardando ? 'Subiendo...' : 'Agregar fotos desde el celular'}
          variante="secundario"
          onPress={seleccionarImagenes}
          deshabilitado={guardando}
        />
      </View>
      <Preferencia titulo="Mostrar en Más vendidos" valor={masVendido} cambiar={setMasVendido} estilos={estilos} colores={colores} />
      <Preferencia titulo="Mostrar en Ofertas" valor={oferta} cambiar={setOferta} estilos={estilos} colores={colores} />
      {oferta && (
        <Text style={estilos.descripcion}>
          Para mostrar un descuento, ingresá un precio final menor al precio normal.
        </Text>
      )}
      <Boton titulo={guardando ? 'Guardando...' : 'Guardar cambios'} onPress={guardar} deshabilitado={guardando} />
      {!esProductoNuevo && (
        <Boton
          titulo="Eliminar producto"
          variante="secundario"
          onPress={solicitarEliminacion}
          deshabilitado={guardando}
        />
      )}
    </ScrollView>
  )
}

function Campo({ titulo, valor, cambiar, estilos, teclado = 'default' }) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{titulo}</Text>
      <TextInput
        value={valor}
        onChangeText={cambiar}
        keyboardType={teclado}
        style={estilos.input}
        placeholderTextColor="#687385"
      />
    </View>
  )
}

function Preferencia({ titulo, valor, cambiar, estilos, colores }) {
  return (
    <View style={estilos.tarjetaPreferencia}>
      <Text style={estilos.etiqueta}>{titulo}</Text>
      <Switch
        value={valor}
        onValueChange={cambiar}
        trackColor={{ false: colores.linea, true: colores.exito }}
        thumbColor={colores.superficie}
      />
    </View>
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { flexGrow: 1, padding: 18, paddingBottom: 36, gap: 14 },
    titulo: { color: colores.tinta, fontSize: 24, fontWeight: '800' },
    subtitulo: { color: colores.tinta, fontSize: 17, fontWeight: '700' },
    descripcion: { color: colores.secundaria, lineHeight: 20 },
    campo: { gap: 6 },
    etiqueta: { color: colores.tinta, fontSize: 14, fontWeight: '700' },
    input: {
      minHeight: 48,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colores.linea,
      backgroundColor: colores.superficie,
      color: colores.tinta,
      fontSize: 16,
    },
    tarjeta: {
      padding: 14,
      gap: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colores.linea,
      backgroundColor: colores.superficie,
    },
    tarjetaPreferencia: {
      paddingHorizontal: 14,
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colores.linea,
      backgroundColor: colores.superficie,
    },
    galeria: { gap: 8 },
    fotoContenedor: { position: 'relative' },
    foto: { width: 82, height: 82, borderRadius: 8, backgroundColor: colores.fondo },
    controlesFoto: {
      position: 'absolute',
      bottom: 3,
      left: 3,
      right: 3,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    botonOrdenFoto: {
      width: 23,
      height: 23,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colores.tinta,
    },
    botonFoto: {
      width: 23,
      height: 23,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colores.error,
    },
    botonFotoDeshabilitado: { opacity: 0.45 },
    revision: {
      padding: 14,
      gap: 8,
      borderRadius: 14,
      backgroundColor: colores.errorClaro,
      borderWidth: 1,
      borderColor: colores.error,
    },
    revisionTitulo: { color: colores.error, fontWeight: '800' },
    error: { color: colores.error, lineHeight: 20 },
    sinAcceso: { justifyContent: 'center', padding: 22, gap: 16 },
  })
}
