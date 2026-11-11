import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'

const imagenSinProducto = require('../../assets/icon.png')

function calcularDesfaseProducto(productoId, intervaloMs) {
  const texto = String(productoId ?? '')
  let hash = 2166136261
  for (let indice = 0; indice < texto.length; indice += 1) {
    hash = Math.imul(hash ^ texto.charCodeAt(indice), 16777619)
  }
  return (hash >>> 0) % intervaloMs
}

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
  const desfaseMs = configuracionCarrusel?.mode === 'individual'
    ? calcularDesfaseProducto(productoId, intervaloMs)
    : 0
  const [indice, setIndice] = useState(0)
  const indiceRef = useRef(0)
  const opacidad = useRef(new Animated.Value(1)).current
  const animacionRef = useRef(null)

  useEffect(() => {
    const tiempoTranscurrido = Math.max(0, Date.now() - inicioCarrusel + desfaseMs)
    const actual = lista.length
      ? Math.floor(tiempoTranscurrido / intervaloMs) % lista.length
      : 0
    indiceRef.current = actual
    setIndice(actual)
    opacidad.setValue(1)
  }, [desfaseMs, firmaGaleria, inicioCarrusel, intervaloMs, lista.length, opacidad])

  useEffect(() => {
    if (!activo || lista.length < 2) return undefined

    let temporizador
    const sincronizarFase = () => {
      const ahora = Date.now()
      const transcurrido = Math.max(0, ahora - inicioCarrusel + desfaseMs)
      const siguiente = Math.floor(transcurrido / intervaloMs) % lista.length
      if (siguiente !== indiceRef.current) {
        animacionRef.current = Animated.timing(opacidad, {
          toValue: 0.2,
          duration: Math.min(850, Math.round(intervaloMs * 0.18)),
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
        animacionRef.current.start(({ finished }) => {
          if (!finished) return
          indiceRef.current = siguiente
          setIndice(siguiente)
          animacionRef.current = Animated.timing(opacidad, {
            toValue: 1,
            duration: Math.min(2200, Math.round(intervaloMs * 0.4)),
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          })
          animacionRef.current.start()
        })
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
      opacidad.stopAnimation()
    }
  }, [activo, desfaseMs, firmaGaleria, inicioCarrusel, intervaloMs, lista.length, opacidad])

  return (
    <Animated.Image
      source={lista.length ? { uri: lista[indice % lista.length] } : imagenSinProducto}
      style={[style, { opacity: opacidad }]}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
    />
  )
}
