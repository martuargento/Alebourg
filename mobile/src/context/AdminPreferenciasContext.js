import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AdminPreferenciasContext = createContext(null)
const CLAVE_MOSTRAR_PRECIOS_ADMIN = 'mostrarPreciosAdmin'

export function AdminPreferenciasProvider({ children }) {
  const [mostrarPreciosAdmin, setMostrarPreciosAdmin] = useState(true)
  const [cargandoPreferencias, setCargandoPreferencias] = useState(true)

  useEffect(() => {
    let activo = true
    AsyncStorage.getItem(CLAVE_MOSTRAR_PRECIOS_ADMIN)
      .then((guardado) => {
        if (activo && guardado !== null) setMostrarPreciosAdmin(guardado === 'true')
      })
      .catch((error) => console.error('No se pudo cargar la preferencia de precios admin:', error))
      .finally(() => {
        if (activo) setCargandoPreferencias(false)
      })
    return () => { activo = false }
  }, [])

  const alternarPreciosAdmin = useCallback(async () => {
    const siguiente = !mostrarPreciosAdmin
    await AsyncStorage.setItem(CLAVE_MOSTRAR_PRECIOS_ADMIN, String(siguiente))
    setMostrarPreciosAdmin(siguiente)
  }, [mostrarPreciosAdmin])

  const value = useMemo(() => ({
    mostrarPreciosAdmin,
    cargandoPreferencias,
    alternarPreciosAdmin,
  }), [mostrarPreciosAdmin, cargandoPreferencias, alternarPreciosAdmin])

  return (
    <AdminPreferenciasContext.Provider value={value}>
      {children}
    </AdminPreferenciasContext.Provider>
  )
}

export function useAdminPreferencias() {
  const context = useContext(AdminPreferenciasContext)
  if (!context) {
    throw new Error('useAdminPreferencias debe utilizarse dentro de AdminPreferenciasProvider.')
  }
  return context
}
