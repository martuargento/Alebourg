import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useEffect, useState } from 'react'
import { Feather } from '@expo/vector-icons'
import Encabezado from '../components/Encabezado'
import { Boton } from '../components/Controles'
import { useTema } from '../context/TemaContext'
import { useAuth } from '../context/AuthContext'
import { useAdminPreferencias } from '../context/AdminPreferenciasContext'
import { guardarConfiguracionProductos, obtenerConfiguracionProductos } from '../api/administracionProductos'
import {
  guardarConfiguracionCarrusel,
  obtenerConfiguracionCarrusel,
} from '../api/configuracion'
import { useCatalogo } from '../context/CatalogoContext'

const SITIO_ALEBOURG = 'https://alebourg.com'
const NUMERO_WHATSAPP = '5491133328382'
const SEGUNDOS_MINIMOS_CARRUSEL = 2
const SEGUNDOS_MAXIMOS_CARRUSEL = 60

export default function CuentaScreen({ navigation }) {
  const { colores } = useTema()
  const { email, isAdmin, cargandoSesion, cerrarSesion } = useAuth()
  const { mostrarPreciosAdmin, alternarPreciosAdmin } = useAdminPreferencias()
  const { productos } = useCatalogo()
  const [configuracionProductos, setConfiguracionProductos] = useState(null)
  const [guardandoOrden, setGuardandoOrden] = useState(false)
  const [configuracionCarrusel, setConfiguracionCarrusel] = useState(null)
  const [modoCarrusel, setModoCarrusel] = useState('synchronized')
  const [segundosCarrusel, setSegundosCarrusel] = useState('6')
  const [guardandoCarrusel, setGuardandoCarrusel] = useState(false)
  const estilos = crearEstilos(colores)

  useEffect(() => {
    if (!isAdmin) return
    obtenerConfiguracionProductos()
      .then(setConfiguracionProductos)
      .catch((error) => Alert.alert('No se pudo cargar la administración', error.message))
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setConfiguracionCarrusel(null)
      return undefined
    }
    let activo = true
    obtenerConfiguracionCarrusel()
      .then((configuracion) => {
        if (!activo) return
        setConfiguracionCarrusel(configuracion)
        setModoCarrusel(configuracion.mode)
        setSegundosCarrusel(String(configuracion.intervalSeconds))
      })
      .catch((error) => {
        if (activo) Alert.alert('No se pudo cargar el ritmo de las fotos', error.message)
      })
    return () => { activo = false }
  }, [isAdmin])

  async function cambiarOrdenPersonalizadoActivo(activo) {
    if (!configuracionProductos) return
    setGuardandoOrden(true)
    try {
      const actualizada = await guardarConfiguracionProductos({
        ...configuracionProductos,
        ordenPersonalizadoActivo: activo,
        orden: activo && !configuracionProductos.orden.length
          ? productos.map((producto) => producto.id)
          : configuracionProductos.orden,
      })
      setConfiguracionProductos(actualizada)
    } catch (error) {
      Alert.alert('No se pudo guardar el orden', error.message)
    } finally {
      setGuardandoOrden(false)
    }
  }

  async function guardarPreferenciasCarrusel() {
    const intervalSeconds = Number(segundosCarrusel)
    if (
      !Number.isInteger(intervalSeconds)
      || intervalSeconds < SEGUNDOS_MINIMOS_CARRUSEL
      || intervalSeconds > SEGUNDOS_MAXIMOS_CARRUSEL
    ) {
      Alert.alert(
        'Intervalo no válido',
        `Elegí un número entero entre ${SEGUNDOS_MINIMOS_CARRUSEL} y ${SEGUNDOS_MAXIMOS_CARRUSEL} segundos.`,
      )
      return
    }
    setGuardandoCarrusel(true)
    try {
      const actualizada = await guardarConfiguracionCarrusel({
        mode: modoCarrusel,
        intervalSeconds,
      })
      setConfiguracionCarrusel(actualizada)
    } catch (error) {
      Alert.alert('No se pudo guardar el ritmo de las fotos', error.message)
    } finally {
      setGuardandoCarrusel(false)
    }
  }

  async function abrirEnlace(url) {
    try {
      await Linking.openURL(url)
    } catch (error) {
      console.error('No se pudo abrir el enlace:', error)
    }
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Encabezado
        navigation={navigation}
        titulo="Tu cuenta"
        subtitulo="Accedé a tu cuenta de Alebourg."
      />
      <View style={estilos.tarjeta}>
        <View style={estilos.icono}>
          <Feather name="user" size={25} color={colores.primarioOscuro} />
        </View>
        <Text style={estilos.titulo}>
          {isAdmin ? 'Sesión de administrador iniciada' : 'Acceso de administrador'}
        </Text>
        <Text style={estilos.descripcion}>
          {isAdmin
            ? `Sesión iniciada como ${email}.`
            : 'Iniciá sesión con tu cuenta de administrador.'}
        </Text>
        {cargandoSesion
          ? (
            <Boton titulo="Cargando cuenta..." cargando deshabilitado />
          )
          : isAdmin
          ? (
            <Boton
              titulo="Cerrar sesión"
              variante="secundario"
              onPress={() => cerrarSesion().catch((error) => {
                Alert.alert('No se pudo cerrar sesión', error.message)
              })}
            />
          )
          : (
            <Boton
              titulo="Iniciar sesión"
              onPress={() => navigation.navigate('IniciarSesion')}
            />
          )}
      </View>
      {isAdmin && !cargandoSesion && (
        <View style={estilos.tarjeta}>
          <View style={estilos.filaPreferencia}>
            <View style={estilos.textosPreferencia}>
              <Text style={estilos.titulo}>Mostrar precios admin</Text>
              <Text style={estilos.descripcion}>
                Muestra el precio de proveedor y la ganancia en los productos.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Mostrar precios admin"
              value={mostrarPreciosAdmin}
              onValueChange={() => alternarPreciosAdmin().catch((error) => {
                Alert.alert('No se pudo guardar la preferencia', error.message)
              })}
              trackColor={{ false: colores.linea, true: colores.exito }}
              thumbColor={colores.superficie}
            />
          </View>
          <Boton
            titulo="Cambiar rangos de precios"
            variante="secundario"
            onPress={() => navigation.navigate('AdminRangos')}
          />
          <Boton
            titulo="Agregar producto manual"
            onPress={() => navigation.navigate('AdminProducto')}
          />
          <View style={estilos.filaPreferencia}>
            <View style={estilos.textosPreferencia}>
              <Text style={estilos.titulo}>Orden personalizado</Text>
              <Text style={estilos.descripcion}>
                Usa el orden guardado para mostrar los productos en la tienda.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Activar orden personalizado"
              value={Boolean(configuracionProductos?.ordenPersonalizadoActivo)}
              disabled={!configuracionProductos || guardandoOrden}
              onValueChange={cambiarOrdenPersonalizadoActivo}
              trackColor={{ false: colores.linea, true: colores.exito }}
              thumbColor={colores.superficie}
            />
          </View>
        </View>
      )}
      {isAdmin && !cargandoSesion && (
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>Rotación de fotos</Text>
          <Text style={estilos.descripcion}>
            La transición entre imágenes usa un fundido suave. La configuración se comparte con la web y todas las apps.
          </Text>
          <View style={estilos.filaPreferencia}>
            <View style={estilos.textosPreferencia}>
              <Text style={estilos.subtitulo}>Sincronizar todos los productos</Text>
              <Text style={estilos.descripcion}>
                {modoCarrusel === 'synchronized'
                  ? 'Todas las tarjetas cambian al mismo tiempo.'
                  : 'En modo individual, definí el intervalo dentro de cada producto.'}
              </Text>
            </View>
            <Switch
              accessibilityLabel="Sincronizar el cambio de fotos de todos los productos"
              value={modoCarrusel === 'synchronized'}
              disabled={!configuracionCarrusel || guardandoCarrusel}
              onValueChange={(sincronizado) => {
                setModoCarrusel(sincronizado ? 'synchronized' : 'individual')
              }}
              trackColor={{ false: colores.linea, true: colores.exito }}
              thumbColor={colores.superficie}
            />
          </View>
          <View style={estilos.campoSegundos}>
            <Text style={estilos.etiquetaSegundos}>Segundos entre cambios</Text>
            <TextInput
              accessibilityLabel="Segundos entre cambios de imagen"
              value={segundosCarrusel}
              onChangeText={(valor) => setSegundosCarrusel(valor.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={2}
              style={estilos.inputSegundos}
              placeholder="6"
              placeholderTextColor={colores.secundaria}
            />
            <Text style={estilos.descripcion}>
              Entre {SEGUNDOS_MINIMOS_CARRUSEL} y {SEGUNDOS_MAXIMOS_CARRUSEL} segundos.
              En modo individual, los productos sin intervalo propio usan este valor.
            </Text>
          </View>
          <Boton
            titulo={guardandoCarrusel ? 'Guardando...' : 'Guardar ritmo de fotos'}
            cargando={guardandoCarrusel}
            deshabilitado={!configuracionCarrusel || guardandoCarrusel}
            onPress={guardarPreferenciasCarrusel}
          />
        </View>
      )}
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>Cuenta de cliente</Text>
        <Text style={estilos.descripcion}>
          Más adelante vas a poder crear una cuenta y acceder a descuentos para clientes.
        </Text>
        <Boton
          titulo="Contactar por WhatsApp"
          variante="secundario"
          onPress={() => abrirEnlace(`https://wa.me/${NUMERO_WHATSAPP}`)}
        />
      </View>
      <Boton
        titulo="Visitar alebourg.com"
        variante="secundario"
        onPress={() => abrirEnlace(SITIO_ALEBOURG)}
      />
      <Text style={estilos.pie}>Alebourg · Cuenta y descuentos para clientes, próximamente</Text>
    </ScrollView>
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { flexGrow: 1, padding: 16, paddingBottom: 32, backgroundColor: colores.fondo, gap: 14 },
  tarjeta: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.linea,
    gap: 12,
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colores.primarioClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { color: colores.tinta, fontSize: 19, fontWeight: '800' },
  descripcion: { color: colores.secundaria, fontSize: 14, lineHeight: 21 },
  pie: { paddingTop: 10, textAlign: 'center', color: colores.secundaria, fontSize: 12 },
  filaPreferencia: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textosPreferencia: { flex: 1, gap: 4 },
  subtitulo: { color: colores.tinta, fontSize: 16, fontWeight: '700' },
  campoSegundos: { gap: 6 },
  etiquetaSegundos: { color: colores.tinta, fontSize: 14, fontWeight: '700' },
  inputSegundos: {
    width: 96,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.linea,
    backgroundColor: colores.superficie,
    color: colores.tinta,
    fontSize: 16,
  },
  })
}
