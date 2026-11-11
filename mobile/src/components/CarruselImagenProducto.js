import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

const imagenSinProducto = require('../../assets/icon.png')

export default function CarruselImagenProducto({
  imagenes,
  imagen,
  style,
  resizeMode = 'contain',
  activo = true,
  accessibilityLabel,
  configuracionCarrusel,
  productoId,
  inicioCarrusel = 0,
}) {
  const lista = useMemo(() => {
    const galeria = Array.isArray(imagenes) ? imagenes.filter(Boolean) : []
    return galeria.length ? galeria : imagen ? [imagen] : []
  }, [imagenes, imagen])
  const firmaGaleria = lista.join('\u0000')
  const intervaloSegundos = configuracionCarrusel?.mode === 'individual'
    ? configuracionCarrusel.productIntervals?.[String(productoId)] ?? configuracionCarrusel.intervalSeconds
    : configuracionCarrusel?.intervalSeconds ?? 6
  const intervaloMs = intervaloSegundos * 1000
  const [indices, setIndices] = useState({ anterior: null, actual: 0 })
  const indicesRef = useRef(indices)
  const opacidadActual = useRef(new Animated.Value(1)).current
  const opacidadAnterior = useRef(new Animated.Value(0)).current
  const animacionRef = useRef(null)

  useEffect(() => {
    const tiempoTranscurrido = Math.max(0, Date.now() - inicioCarrusel)
    const actual = lista.length
      ? Math.floor(tiempoTranscurrido / intervaloMs) % lista.length
      : 0
    const reiniciados = { anterior: null, actual }
    indicesRef.current = reiniciados
    setIndices(reiniciados)
    opacidadActual.setValue(1)
    opacidadAnterior.setValue(0)
  }, [firmaGaleria, inicioCarrusel, intervaloMs, lista.length, opacidadActual, opacidadAnterior])

  useEffect(() => {
    if (!activo || lista.length < 2) return undefined

    let temporizador
    const sincronizarFase = () => {
      const ahora = Date.now()
      const transcurrido = Math.max(0, ahora - inicioCarrusel)
      const siguiente = Math.floor(transcurrido / intervaloMs) % lista.length
      const actual = indicesRef.current.actual
      if (siguiente !== actual) {
        const nuevosIndices = { anterior: actual, actual: siguiente }
        indicesRef.current = nuevosIndices
        setIndices(nuevosIndices)
        opacidadActual.setValue(0)
        opacidadAnterior.setValue(1)
        animacionRef.current = Animated.parallel([
          Animated.timing(opacidadActual, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacidadAnterior, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
        animacionRef.current.start()
      }
      temporizador = setTimeout(
        sincronizarFase,
        intervaloMs - (transcurrido % intervaloMs),
      )
    }

    sincronizarFase()

    return () => {
      clearTimeout(temporizador)
      animacionRef.current?.stop()
    }
  }, [activo, firmaGaleria, inicioCarrusel, intervaloMs, lista.length, opacidadActual, opacidadAnterior])

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[style, { overflow: 'hidden' }]}
    >
      {indices.anterior !== null && lista.length > 1 && (
        <Animated.Image
          source={lista.length ? { uri: lista[indices.anterior % lista.length] } : imagenSinProducto}
          style={[StyleSheet.absoluteFillObject, { opacity: opacidadAnterior }]}
          resizeMode={resizeMode}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      )}
      <Animated.Image
        source={lista.length ? { uri: lista[indices.actual % lista.length] } : imagenSinProducto}
        style={[StyleSheet.absoluteFillObject, { opacity: opacidadActual }]}
        resizeMode={resizeMode}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  )
}
