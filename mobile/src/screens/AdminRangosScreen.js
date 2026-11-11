import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import Encabezado from '../components/Encabezado'
import { Boton, Cargando, Mensaje } from '../components/Controles'
import { guardarConfiguracionPrecios, obtenerConfiguracionPrecios } from '../api/configuracion'
import { obtenerErrorApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useCatalogo } from '../context/CatalogoContext'
import { useTema } from '../context/TemaContext'

function valorNumericoValido(valor) {
  return valor !== ''
    && Number.isFinite(Number(valor))
    && Number(valor) >= 0
}

function validarConfiguracion(rangos, ajusteEspecial, minimoAuriculares) {
  if (rangos.length < 2 || !rangos[rangos.length - 1]?.mayorIgual) {
    return 'Debe haber al menos dos rangos y el último debe ser mayor o igual.'
  }

  const rangosValidos = rangos.every((rango, indice) => (
    valorNumericoValido(rango.limite)
    && valorNumericoValido(rango.monto)
    && Boolean(rango.mayorIgual) === (indice === rangos.length - 1)
    && (
      indice === 0
      || Number(rango.limite) > Number(rangos[indice - 1].limite)
      || (
        indice === rangos.length - 1
        && Number(rango.limite) === Number(rangos[indice - 1].limite)
      )
    )
  ))
  if (!rangosValidos) {
    return 'Revisá los límites y montos: deben ser válidos y los límites deben crecer.'
  }
  if (!valorNumericoValido(minimoAuriculares)) {
    return 'El precio mínimo para auriculares no es válido.'
  }
  if (ajusteEspecial && (
    !ajusteEspecial.prefijoTitulo.trim()
    || !valorNumericoValido(ajusteEspecial.limite)
    || !valorNumericoValido(ajusteEspecial.monto)
  )) {
    return 'Completá el prefijo, el límite y el monto del ajuste especial.'
  }
  return ''
}

export default function AdminRangosScreen({ navigation }) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)
  const { isAdmin } = useAuth()
  const { actualizarConfiguracionPrecios } = useCatalogo()
  const [rangos, setRangos] = useState([])
  const [ajusteEspecial, setAjusteEspecial] = useState(null)
  const [minimoAuriculares, setMinimoAuriculares] = useState('')
  const [cargando, setCargando] = useState(true)
  const [configuracionCargada, setConfiguracionCargada] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargarConfiguracion = useCallback(async () => {
    setCargando(true)
    setConfiguracionCargada(false)
    setError('')
    try {
      const configuracion = await obtenerConfiguracionPrecios()
      actualizarConfiguracionPrecios(configuracion)
      setRangos(configuracion.rangos.map((rango) => ({
        limite: String(rango.limite),
        monto: String(rango.monto),
        mayorIgual: Boolean(rango.mayorIgual),
      })))
      setAjusteEspecial(configuracion.ajusteEspecial
        ? {
          prefijoTitulo: configuracion.ajusteEspecial.prefijoTitulo,
          limite: String(configuracion.ajusteEspecial.limite),
          monto: String(configuracion.ajusteEspecial.monto),
        }
        : null)
      setMinimoAuriculares(String(configuracion.minimoAuriculares))
      setConfiguracionCargada(true)
    } catch (errorCarga) {
      setError(obtenerErrorApi(errorCarga, 'No se pudieron cargar los rangos de precios.'))
    } finally {
      setCargando(false)
    }
  }, [actualizarConfiguracionPrecios])

  useEffect(() => {
    cargarConfiguracion()
  }, [cargarConfiguracion])

  function actualizarRango(indice, campo, valor) {
    setRangos((actuales) => actuales.map((rango, posicion) => (
      posicion === indice ? { ...rango, [campo]: valor } : rango
    )))
  }

  function ajustarRango(indice, campo, diferencia) {
    setRangos((actuales) => actuales.map((rango, posicion) => {
      if (posicion !== indice) return rango
      const valorActual = Number(rango[campo] || 0)
      return { ...rango, [campo]: String(Math.max(0, valorActual + diferencia)) }
    }))
  }

  function agregarRango() {
    setError('')
    if (rangos.length < 2) {
      setRangos([
        { limite: '', monto: '' },
        { limite: '', monto: '', mayorIgual: true },
      ])
      return
    }

    const ultimo = rangos[rangos.length - 1]
    const anterior = rangos[rangos.length - 2]
    if (!valorNumericoValido(ultimo.limite)) {
      setError('Completá el límite actual antes de agregar otro rango.')
      return
    }

    const limiteActual = Number(ultimo.limite)
    const nuevosRangos = rangos.slice(0, -1)
    if (anterior && limiteActual > Number(anterior.limite)) {
      nuevosRangos.push({ limite: String(limiteActual), monto: '0' })
    }
    nuevosRangos.push(
      { ...ultimo, limite: String(limiteActual + 500), mayorIgual: false },
      { ...ultimo, limite: String(limiteActual + 500), mayorIgual: true },
    )
    setRangos(nuevosRangos)
  }

  function eliminarRango(indice) {
    if (rangos.length <= 2 || indice === rangos.length - 1) return
    setRangos((actuales) => actuales.filter((_, posicion) => posicion !== indice))
  }

  async function guardarCambios() {
    if (!isAdmin) {
      setError('Iniciá sesión como administrador para guardar estos cambios.')
      return
    }
    const errorValidacion = validarConfiguracion(rangos, ajusteEspecial, minimoAuriculares)
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }

    setGuardando(true)
    setError('')
    try {
      const configuracion = await guardarConfiguracionPrecios({
        rangos,
        ajusteEspecial,
        minimoAuriculares,
      })
      actualizarConfiguracionPrecios(configuracion)
      setRangos(configuracion.rangos.map((rango) => ({
        limite: String(rango.limite),
        monto: String(rango.monto),
        mayorIgual: Boolean(rango.mayorIgual),
      })))
      setAjusteEspecial(configuracion.ajusteEspecial
        ? {
          prefijoTitulo: configuracion.ajusteEspecial.prefijoTitulo,
          limite: String(configuracion.ajusteEspecial.limite),
          monto: String(configuracion.ajusteEspecial.monto),
        }
        : null)
      setMinimoAuriculares(String(configuracion.minimoAuriculares))
      Alert.alert('Cambios guardados', 'Los precios de la tienda se actualizaron.')
    } catch (errorGuardar) {
      setError(obtenerErrorApi(errorGuardar, 'No se pudieron guardar los cambios.'))
    } finally {
      setGuardando(false)
    }
  }

  if (!isAdmin) {
    return (
      <View style={[estilos.pantalla, estilos.estado]}>
        <Mensaje
          titulo="Acceso solo para administrador"
          detalle="Iniciá sesión para administrar los rangos de precios."
          tipo="error"
        />
        <Boton titulo="Volver" variante="secundario" onPress={() => navigation.goBack()} />
      </View>
    )
  }

  if (cargando) return <Cargando mensaje="Cargando rangos de precios..." />

  if (!configuracionCargada) {
    return (
      <View style={[estilos.pantalla, estilos.estado]}>
        <Encabezado
          navigation={navigation}
          titulo="Rangos de precios"
          subtitulo="No pudimos cargar la configuración."
        />
        <Mensaje titulo="Error al cargar los rangos" detalle={error} tipo="error" />
        <Boton titulo="Reintentar" onPress={cargarConfiguracion} />
        <Boton titulo="Volver" variante="secundario" onPress={() => navigation.goBack()} />
      </View>
    )
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Encabezado
        navigation={navigation}
        titulo="Rangos de precios"
        subtitulo="Los cambios impactan en los precios de toda la tienda."
      />
      {!!error && <Mensaje titulo="Revisá la configuración" detalle={error} tipo="error" />}

      <View style={estilos.seccion}>
        {rangos.map((rango, indice) => {
          const esUltimo = indice === rangos.length - 1
          return (
            <View key={`rango-${indice}`} style={[estilos.tarjetaRango, esUltimo && estilos.rangoFinal]}>
              <Text style={estilos.tituloRango}>
                {esUltimo ? 'Si el precio es mayor o igual a' : 'Si el precio es menor a'}
              </Text>
              <View style={estilos.filaCampos}>
                <View style={estilos.campo}>
                  <Text style={estilos.etiqueta}>Límite</Text>
                  <TextInput
                    accessibilityLabel={`Límite del rango ${indice + 1}`}
                    editable={!esUltimo}
                    keyboardType="numeric"
                    onChangeText={(valor) => actualizarRango(indice, 'limite', valor)}
                    style={[estilos.entrada, esUltimo && estilos.entradaDeshabilitada]}
                    value={rango.limite}
                  />
                </View>
                <View style={estilos.ajuste}>
                  <Text style={estilos.etiqueta}>Sumar</Text>
                  <View style={estilos.filaAjuste}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Restar 500 al ajuste"
                      onPress={() => ajustarRango(indice, 'monto', -500)}
                      style={estilos.botonPaso}
                    >
                      <Feather name="minus" size={18} color={colores.primario} />
                    </Pressable>
                    <TextInput
                      accessibilityLabel={`Ajuste del rango ${indice + 1}`}
                      keyboardType="numeric"
                      onChangeText={(valor) => actualizarRango(indice, 'monto', valor)}
                      style={[estilos.entrada, estilos.entradaMonto]}
                      value={rango.monto}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Sumar 500 al ajuste"
                      onPress={() => ajustarRango(indice, 'monto', 500)}
                      style={estilos.botonPaso}
                    >
                      <Feather name="plus" size={18} color={colores.primario} />
                    </Pressable>
                  </View>
                </View>
              </View>
              {!esUltimo && rangos.length > 2 && (
                <Boton
                  titulo="Eliminar rango"
                  variante="peligro"
                  onPress={() => eliminarRango(indice)}
                />
              )}
            </View>
          )
        })}
        <Boton titulo="Agregar rango" variante="secundario" onPress={agregarRango} />
      </View>

      <View style={estilos.tarjeta}>
        <View style={estilos.filaSwitch}>
          <Text style={estilos.tituloSeccion}>Ajuste especial por prefijo</Text>
          <Switch
            accessibilityLabel="Activar ajuste especial por prefijo"
            value={Boolean(ajusteEspecial)}
            onValueChange={(habilitado) => setAjusteEspecial(habilitado
              ? { prefijoTitulo: '', limite: '', monto: '' }
              : null)}
            trackColor={{ false: colores.linea, true: colores.exito }}
            thumbColor={colores.superficie}
          />
        </View>
        <Text style={estilos.descripcion}>
          Aplicar un ajuste a productos cuyo título comienza con el prefijo indicado.
        </Text>
        {ajusteEspecial && (
          <>
            <CampoTexto
              etiqueta="Prefijo del título"
              valor={ajusteEspecial.prefijoTitulo}
              onChangeText={(valor) => setAjusteEspecial((actual) => ({
                ...actual,
                prefijoTitulo: valor,
              }))}
              estilos={estilos}
            />
            <View style={estilos.filaCampos}>
              <CampoTexto
                etiqueta="Si el precio es menor a"
                valor={ajusteEspecial.limite}
                onChangeText={(valor) => setAjusteEspecial((actual) => ({
                  ...actual,
                  limite: valor,
                }))}
                estilos={estilos}
                numerico
              />
              <CampoTexto
                etiqueta="Sumar"
                valor={ajusteEspecial.monto}
                onChangeText={(valor) => setAjusteEspecial((actual) => ({
                  ...actual,
                  monto: valor,
                }))}
                estilos={estilos}
                numerico
              />
            </View>
          </>
        )}
      </View>

      <View style={estilos.tarjeta}>
        <CampoTexto
          etiqueta="Precio mínimo para auriculares"
          valor={minimoAuriculares}
          onChangeText={setMinimoAuriculares}
          estilos={estilos}
          numerico
        />
      </View>

      <Boton
        titulo="Guardar cambios"
        onPress={guardarCambios}
        cargando={guardando}
        deshabilitado={guardando}
      />
      <Boton
        titulo="Volver"
        variante="secundario"
        onPress={() => navigation.goBack()}
        deshabilitado={guardando}
      />
    </ScrollView>
  )
}

function CampoTexto({ etiqueta, valor, onChangeText, estilos, numerico = false }) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        accessibilityLabel={etiqueta}
        keyboardType={numerico ? 'numeric' : 'default'}
        onChangeText={onChangeText}
        style={estilos.entrada}
        value={valor}
      />
    </View>
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { flexGrow: 1, padding: 16, paddingBottom: 32, gap: 14 },
    estado: { justifyContent: 'center', padding: 20, gap: 16 },
    seccion: { gap: 12 },
    tarjeta: {
      padding: 16,
      borderRadius: 18,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.linea,
      gap: 12,
    },
    tarjetaRango: {
      padding: 16,
      borderRadius: 18,
      backgroundColor: colores.superficie,
      borderWidth: 1,
      borderColor: colores.linea,
      gap: 12,
    },
    rangoFinal: { backgroundColor: '#E0F2FE', borderColor: '#0EA5E9' },
    tituloRango: { color: colores.tinta, fontSize: 15, fontWeight: '700' },
    tituloSeccion: { flex: 1, color: colores.tinta, fontSize: 16, fontWeight: '700' },
    descripcion: { color: colores.secundaria, fontSize: 13, lineHeight: 19 },
    filaCampos: { flexDirection: 'row', gap: 12 },
    campo: { flex: 1, gap: 6 },
    ajuste: { flex: 1.4, gap: 6 },
    etiqueta: { color: colores.secundaria, fontSize: 12, fontWeight: '600' },
    entrada: {
      minHeight: 46,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colores.linea,
      borderRadius: 10,
      backgroundColor: colores.superficie,
      color: colores.tinta,
      fontSize: 16,
      textAlign: 'center',
    },
    entradaMonto: { flex: 1 },
    entradaDeshabilitada: { backgroundColor: '#F3F4F6', color: colores.secundaria },
    filaAjuste: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    botonPaso: {
      width: 36,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colores.linea,
      borderRadius: 9,
      backgroundColor: colores.fondo,
    },
    filaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  })
}
