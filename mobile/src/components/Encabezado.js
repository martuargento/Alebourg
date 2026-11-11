import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTema } from '../context/TemaContext'

const logoAlebourg = require('../../assets/Logoheader.png')

export default function Encabezado({ navigation, titulo, subtitulo, centrarTitulo = false }) {
  const { colores } = useTema()
  const estilos = crearEstilos(colores)

  return (
    <View style={estilos.encabezado}>
      <View style={estilos.filaSuperior}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ir a la tienda"
          onPress={() => navigation.navigate('Principal', { screen: 'Tienda' })}
          style={estilos.logoBoton}
        >
          <Image
            source={logoAlebourg}
            style={estilos.logo}
            resizeMode="contain"
            accessibilityLabel="Alebourg"
          />
        </Pressable>
      </View>
      {!!titulo && (
        <View style={[estilos.titulos, centrarTitulo && estilos.titulosCentrados]}>
          <Text style={estilos.titulo}>{titulo}</Text>
          {!!subtitulo && <Text style={estilos.subtitulo}>{subtitulo}</Text>}
        </View>
      )}
    </View>
  )
}

function crearEstilos(colores) {
  return StyleSheet.create({
  encabezado: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 15, backgroundColor: colores.fondo },
  filaSuperior: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoBoton: { borderRadius: 4, transform: [{ translateY: 12 }] },
  logo: { width: 110, height: 44 },
  titulos: { marginTop: 15, gap: 4 },
  titulosCentrados: { alignItems: 'center' },
  titulo: {
    color: colores.tinta,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  subtitulo: { color: colores.secundaria, fontSize: 14, lineHeight: 20 },
  })
}
