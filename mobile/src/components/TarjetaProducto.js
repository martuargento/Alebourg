import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Boton } from './Controles'
import CarruselImagenProducto from './CarruselImagenProducto'
import { obtenerPrecioFinal, parsearPrecio } from '../utils/precios'
import { formatearPrecio } from '../utils/formato'
import { useTema } from '../context/TemaContext'
import { useAuth } from '../context/AuthContext'
import { useAdminPreferencias } from '../context/AdminPreferenciasContext'

const MAX_CARACTERES_POR_LINEA = 20

function formatearTituloCompacto(titulo) {
  const fragmentos = String(titulo || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((palabra) => {
      const caracteres = Array.from(palabra)
      const partes = []
      for (let indice = 0; indice < caracteres.length; indice += MAX_CARACTERES_POR_LINEA) {
        partes.push({
          texto: caracteres.slice(indice, indice + MAX_CARACTERES_POR_LINEA).join(''),
          separar: indice === 0,
        })
      }
      return partes
    })
  const lineas = []
  let linea = ''

  fragmentos.forEach((fragmento) => {
    const separador = linea && fragmento.separar ? ' ' : ''
    const siguiente = `${linea}${separador}${fragmento.texto}`
    if (Array.from(siguiente).length > MAX_CARACTERES_POR_LINEA) {
      lineas.push(linea)
      linea = fragmento.texto
    } else {
      linea = siguiente
    }
  })
  if (linea) lineas.push(linea)
  if (lineas.length > 2) {
    const ultimaLinea = Array.from(lineas[1]).slice(0, MAX_CARACTERES_POR_LINEA - 1).join('').trimEnd()
    lineas[1] = `${ultimaLinea}…`
  }
  return lineas.slice(0, 2).join('\n')
}

function TarjetaProducto({
  producto,
  configuracionPrecios,
  compacta,
  centrarContenido = false,
  activo = true,
  configuracionCarrusel,
  alAbrir,
  agregarAlCarrito,
}) {
  const { colores } = useTema()
  const { isAdmin } = useAuth()
  const { mostrarPreciosAdmin } = useAdminPreferencias()
  const estilos = crearEstilos(colores)
  const mostrarDetalleAdmin = isAdmin && mostrarPreciosAdmin
  const precioProveedor = mostrarDetalleAdmin ? parsearPrecio(producto.precio) : 0
  const precio = obtenerPrecioFinal(producto, configuracionPrecios)
  const precioRegular = producto.enOferta
    ? obtenerPrecioFinal({ ...producto, precioFinal: null }, configuracionPrecios)
    : precio
  const tieneDescuento = producto.enOferta && precio < precioRegular
  const ganancia = Math.max(0, precio - precioProveedor)

  return (
    <View style={[estilos.tarjeta, compacta && estilos.tarjetaCompacta]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver ${producto.titulo}`}
        onPress={() => alAbrir(producto)}
        style={estilos.contenidoProducto}
      >
        <CarruselImagenProducto
          imagenes={producto.imagenes}
          imagen={producto.imagen}
          activo={activo}
          configuracionCarrusel={configuracionCarrusel}
          productoId={producto.id}
          accessibilityLabel={`${producto.titulo}, foto del producto`}
          style={[
            estilos.imagen,
            compacta && estilos.imagenCompacta,
            compacta && mostrarDetalleAdmin && estilos.imagenCompactaAdmin,
          ]}
        />
        <View style={[
          estilos.detalles,
          compacta && estilos.detallesCompactos,
          compacta && mostrarDetalleAdmin && estilos.detallesCompactosAdmin,
          centrarContenido && estilos.detallesCentrados,
        ]}>
          <Text
            style={[
              estilos.nombre,
              compacta && estilos.nombreCompacto,
              centrarContenido && estilos.textoCentrado,
            ]}
            numberOfLines={compacta ? 2 : 3}
            ellipsizeMode="tail"
          >
            {compacta ? formatearTituloCompacto(producto.titulo) : producto.titulo}
          </Text>
          {producto.enOferta && <Text style={estilos.etiquetaOferta}>OFERTA</Text>}
          {tieneDescuento && (
            <Text style={estilos.precioAnterior}>{formatearPrecio(precioRegular)}</Text>
          )}
          <Text style={[
            estilos.precio,
            compacta && estilos.precioCompacto,
            centrarContenido && estilos.precioCentrado,
          ]}>
            {formatearPrecio(precio)}
          </Text>
          {mostrarDetalleAdmin && (
            <View style={estilos.detallesAdmin}>
              <Text style={estilos.precioAdmin}>
                Proveedor: {formatearPrecio(precioProveedor)}
              </Text>
              <Text style={estilos.gananciaAdmin}>
                Ganancia: {formatearPrecio(ganancia)}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      <View style={[estilos.accion, compacta && estilos.accionCompacta]}>
        <Boton
          titulo={compacta ? 'Agregar' : 'Agregar al carrito'}
          icono={compacta ? 'shopping-cart' : undefined}
          onPress={() => agregarAlCarrito(producto)}
          compacto={compacta}
        />
      </View>
    </View>
  )
}

export default memo(TarjetaProducto)

function crearEstilos(colores) {
  return StyleSheet.create({
  tarjeta: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.linea,
    shadowColor: colores.sombra,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  tarjetaCompacta: { borderRadius: 8 },
  etiquetaOferta: { color: colores.error, fontSize: 10, fontWeight: '900' },
  precioAnterior: { color: colores.secundaria, fontSize: 11, textDecorationLine: 'line-through' },
  contenidoProducto: { flex: 1 },
  imagen: { width: '100%', height: 240, backgroundColor: '#FFFFFF' },
  imagenCompacta: { height: '55%' },
  imagenCompactaAdmin: { height: '43%' },
  detalles: { flex: 1, paddingHorizontal: 16, paddingTop: 13, gap: 5, minHeight: 106 },
  detallesCompactos: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 4,
    gap: 2,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detallesCentrados: { alignItems: 'center' },
  textoCentrado: { alignSelf: 'stretch', textAlign: 'center' },
  nombre: { color: colores.tinta, fontSize: 16, fontWeight: '800', lineHeight: 22 },
  nombreCompacto: {
    width: '92%',
    alignSelf: 'center',
    height: 48,
    minHeight: 48,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 22,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  precio: { marginTop: 4, color: colores.tinta, fontSize: 21, fontWeight: '800' },
  precioCompacto: {
    marginTop: 2,
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
  },
  precioCentrado: { alignSelf: 'center', textAlign: 'center' },
  detallesCompactosAdmin: { paddingTop: 1, gap: 0 },
  detallesAdmin: { marginTop: 2, gap: 1 },
  precioAdmin: { color: colores.secundaria, fontSize: 9, lineHeight: 12 },
  gananciaAdmin: { color: colores.exito, fontSize: 9, lineHeight: 12 },
  accion: { padding: 14, paddingTop: 8 },
  accionCompacta: {
    height: 48,
    paddingHorizontal: 8,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  })
}
