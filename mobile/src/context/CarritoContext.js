import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CarritoContext = createContext(null)
const AccionesCarritoContext = createContext(null)
const CantidadCarritoContext = createContext(0)
const CLAVE_CARRITO = 'alebourg-carrito'

export function CarritoProvider({ children }) {
  const [items, setItems] = useState([])
  const [cargandoCarrito, setCargandoCarrito] = useState(true)

  useEffect(() => {
    let activo = true
    AsyncStorage.getItem(CLAVE_CARRITO)
      .then((guardado) => {
        if (!activo || !guardado) return
        const itemsGuardados = JSON.parse(guardado)
        if (Array.isArray(itemsGuardados)) setItems(itemsGuardados)
      })
      .catch((error) => console.error('No se pudo recuperar el carrito:', error))
      .finally(() => { if (activo) setCargandoCarrito(false) })
    return () => { activo = false }
  }, [])

  useEffect(() => {
    if (cargandoCarrito) return
    AsyncStorage.setItem(CLAVE_CARRITO, JSON.stringify(items))
      .catch((error) => console.error('No se pudo guardar el carrito:', error))
  }, [items, cargandoCarrito])

  const agregarAlCarrito = useCallback((producto) => {
    setItems((itemsActuales) => {
      const existente = itemsActuales.find((item) => item.id === producto.id)
      return existente
        ? itemsActuales.map((item) => (
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        ))
        : [...itemsActuales, { ...producto, cantidad: 1 }]
    })
  }, [])

  const cambiarCantidad = useCallback((id, cambio) => {
    setItems((itemsActuales) => itemsActuales
      .map((item) => item.id === id ? { ...item, cantidad: item.cantidad + cambio } : item)
      .filter((item) => item.cantidad > 0))
  }, [])

  const quitarDelCarrito = useCallback((id) => {
    setItems((itemsActuales) => itemsActuales.filter((item) => item.id !== id))
  }, [])

  const vaciarCarrito = useCallback(() => setItems([]), [])
  const cantidadTotal = items.reduce((total, item) => total + item.cantidad, 0)

  const estado = useMemo(() => ({ items, cargandoCarrito }), [items, cargandoCarrito])
  const acciones = useMemo(() => ({
    agregarAlCarrito,
    cambiarCantidad,
    quitarDelCarrito,
    vaciarCarrito,
  }), [
    agregarAlCarrito,
    cambiarCantidad,
    quitarDelCarrito,
    vaciarCarrito,
  ])

  return (
    <AccionesCarritoContext.Provider value={acciones}>
      <CantidadCarritoContext.Provider value={cantidadTotal}>
        <CarritoContext.Provider value={estado}>{children}</CarritoContext.Provider>
      </CantidadCarritoContext.Provider>
    </AccionesCarritoContext.Provider>
  )
}

export function useCarrito() {
  const context = useContext(CarritoContext)
  if (!context) throw new Error('useCarrito debe utilizarse dentro de CarritoProvider.')
  return context
}

export function useAccionesCarrito() {
  const context = useContext(AccionesCarritoContext)
  if (!context) throw new Error('useAccionesCarrito debe utilizarse dentro de CarritoProvider.')
  return context
}

export function useCantidadCarrito() {
  return useContext(CantidadCarritoContext)
}
