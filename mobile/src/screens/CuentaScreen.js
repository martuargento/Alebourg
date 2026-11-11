import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import { Feather } from '@expo/vector-icons'
import Encabezado from '../components/Encabezado'
import { Boton } from '../components/Controles'
import { useTema } from '../context/TemaContext'
import { useAuth } from '../context/AuthContext'
import { useAdminPreferencias } from '../context/AdminPreferenciasContext'
import { guardarConfiguracionProductos, obtenerConfiguracionProductos } from '../api/administracionProductos'
import { useCatalogo } from '../context/CatalogoContext'

const SITIO_ALEBOURG = 'https://alebourg.com'
const NUMERO_WHATSAPP = '5491133328382'

export default function CuentaScreen({ navigation }) {
  const { colores } = useTema()
  const { email, isAdmin, cargandoSesion, cerrarSesion } = useAuth()
  const { mostrarPreciosAdmin, alternarPreciosAdmin } = useAdminPreferencias()
  const { productos } = useCatalogo()
  const [configuracionProductos, setConfiguracionProductos] = useState(null)
  const [guardandoOrden, setGuardandoOrden] = useState(false)
  const estilos = crearEstilos(colores)

  useEffect(() => {
    if (!isAdmin) return
    obtenerConfiguracionProductos()
      .then(setConfiguracionProductos)
      .catch((error) => Alert.alert('No se pudo cargar la administración', error.message))
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
  })
}
