import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useTema } from '../context/TemaContext'

export function Boton({
  titulo,
  onPress,
  variante = 'principal',
  deshabilitado = false,
  cargando = false,
  compacto = false,
  icono,
}) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const secundario = variante === 'secundario'
  const peligro = variante === 'peligro'
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={deshabilitado || cargando}
      style={({ pressed }) => [
        estilos.boton,
        compacto && estilos.botonCompacto,
        secundario && estilos.botonSecundario,
        peligro && estilos.botonPeligro,
        (deshabilitado || cargando) && estilos.deshabilitado,
        pressed && !secundario && !peligro && estilos.botonPresionado,
        pressed && (secundario || peligro) && estilos.presionado,
      ]}
    >
      {cargando
        ? <ActivityIndicator color={secundario ? colores.primario : colores.tinta} />
        : (
          <View style={estilos.contenidoBoton}>
            {!!icono && (
              <Feather
                name={icono}
                size={compacto ? 20 : 18}
                color={secundario ? colores.primario : colores.superficie}
              />
            )}
            <Text style={[
              estilos.textoBoton,
              compacto && estilos.textoBotonCompacto,
              secundario && estilos.textoBotonSecundario,
              peligro && estilos.textoBotonPeligro,
            ]}
            >
              {titulo}
            </Text>
          </View>
        )}
    </Pressable>
  )
}

export function Mensaje({ titulo, detalle, tipo = 'info' }) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const esError = tipo === 'error'
  const esExito = tipo === 'exito'
  return (
    <View style={[estilos.mensaje, esError && estilos.mensajeError, esExito && estilos.mensajeExito]}>
      {!!titulo && (
        <Text style={[
          estilos.tituloMensaje,
          esError && estilos.textoError,
          esExito && estilos.textoExito,
        ]}
        >
          {titulo}
        </Text>
      )}
      {!!detalle && <Text style={estilos.detalleMensaje}>{detalle}</Text>}
    </View>
  )
}

export function Cargando({ mensaje = 'Cargando...' }) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  return (
    <View style={estilos.cargando}>
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={estilos.detalleMensaje}>{mensaje}</Text>
    </View>
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
  boton: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: colores.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenidoBoton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  botonCompacto: {
    width: 155,
    maxWidth: '100%',
    height: 30,
    minHeight: 30,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  botonSecundario: { backgroundColor: colores.primarioClaro },
  botonPeligro: { backgroundColor: colores.errorClaro },
  textoBoton: { color: colores.superficie, fontSize: 15, fontWeight: '700' },
  textoBotonCompacto: { fontSize: 16, lineHeight: 20 },
  textoBotonSecundario: { color: colores.primario },
  textoBotonPeligro: { color: colores.error },
  deshabilitado: { opacity: 0.55 },
  presionado: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  botonPresionado: { backgroundColor: colores.ctaHover },
  mensaje: { padding: 14, borderRadius: 14, backgroundColor: colores.primarioClaro, gap: 4 },
  mensajeError: { backgroundColor: colores.errorClaro },
  mensajeExito: { backgroundColor: colores.primarioClaro },
  tituloMensaje: { color: colores.tinta, fontSize: 14, fontWeight: '700' },
  detalleMensaje: { color: colores.secundaria, fontSize: 14, lineHeight: 21 },
  textoError: { color: colores.error },
  textoExito: { color: colores.exito },
  cargando: { paddingVertical: 32, alignItems: 'center', gap: 12 },
  })
}
