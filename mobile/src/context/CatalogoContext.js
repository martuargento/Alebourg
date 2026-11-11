import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { obtenerConfiguracionPrecios } from '../api/configuracion'
import { obtenerCategorias, obtenerProductos } from '../api/productos'
import { obtenerProductosDestacados } from '../api/administracionProductos'

const CatalogoContext = createContext(null)

export function CatalogoProvider({ children }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [configuracionPrecios, setConfiguracionPrecios] = useState(null)
  const [productosDestacados, setProductosDestacados] = useState({ masVendidos: [], ofertas: [] })
  const [errorCatalogo, setErrorCatalogo] = useState(null)

  const cargarCatalogo = useCallback(async () => {
    setErrorCatalogo(null)
    try {
      const [listaProductos, listaCategorias, configuracion, destacados] = await Promise.all([
        obtenerProductos(),
        obtenerCategorias(),
        obtenerConfiguracionPrecios(),
        obtenerProductosDestacados(),
      ])
      setProductos(listaProductos)
      setCategorias(listaCategorias)
      setConfiguracionPrecios(configuracion)
      setProductosDestacados(destacados)
      return listaProductos
    } catch (error) {
      setErrorCatalogo(error)
      throw error
    }
  }, [])

  const value = useMemo(() => ({
    productos,
    categorias,
    configuracionPrecios,
    productosDestacados,
    errorCatalogo,
    cargarCatalogo,
    actualizarConfiguracionPrecios: setConfiguracionPrecios,
  }), [productos, categorias, configuracionPrecios, productosDestacados, errorCatalogo, cargarCatalogo])

  return <CatalogoContext.Provider value={value}>{children}</CatalogoContext.Provider>
}

export function useCatalogo() {
  const context = useContext(CatalogoContext)
  if (!context) throw new Error('useCatalogo debe utilizarse dentro de CatalogoProvider.')
  return context
}
