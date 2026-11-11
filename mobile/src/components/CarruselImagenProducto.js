import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated } from 'react-native'

const imagenSinProducto = require('../../assets/icon.png')

export default function CarruselImagenProducto({
  imagenes,
  imagen,
  style,
  resizeMode = 'contain',
  activo = true,
  accessibilityLabel,
}) {
  const lista = useMemo(() => {
    const galeria = Array.isArray(imagenes) ? imagenes.filter(Boolean) : []
    return galeria.length ? galeria : imagen ? [imagen] : []
  }, [imagenes, imagen])
  const firmaGaleria = lista.join('\u0000')
  const [indice, setIndice] = useState(0)
  const opacidad = useRef(new Animated.Value(1)).current
  const escala = useRef(new Animated.Value(1)).current

  useEffect(() => {
    setIndice(0)
    opacidad.setValue(1)
    escala.setValue(1)
  }, [firmaGaleria, opacidad, escala])

  useEffect(() => {
    if (!activo || lista.length < 2) return undefined

    const intervalo = setInterval(() => {
      Animated.timing(opacidad, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return
        setIndice((actual) => (actual + 1) % lista.length)
        escala.setValue(0.97)
        Animated.parallel([
          Animated.timing(opacidad, {
            toValue: 1,
            duration: 360,
            useNativeDriver: true,
          }),
          Animated.timing(escala, {
            toValue: 1,
            duration: 360,
            useNativeDriver: true,
          }),
        ]).start()
      })
    }, 3000)

    return () => {
      clearInterval(intervalo)
      opacidad.stopAnimation()
      escala.stopAnimation()
    }
  }, [activo, lista.length, opacidad, escala])

  return (
    <Animated.Image
      source={lista.length ? { uri: lista[indice % lista.length] } : imagenSinProducto}
      style={[style, { opacity: opacidad, transform: [{ scale: escala }] }]}
      resizeMode={resizeMode}
      accessibilityLabel={accessibilityLabel}
    />
  )
}
