import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { iniciarSesionAdministrador } from '../api/auth'

const AuthContext = createContext(null)
const CLAVE_TOKEN_ADMIN = 'alebourg-admin-token'
const CLAVE_EMAIL_ADMIN = 'alebourg-admin-email'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [email, setEmail] = useState('')
  const [cargandoSesion, setCargandoSesion] = useState(true)

  useEffect(() => {
    let activo = true
    Promise.all([
      SecureStore.getItemAsync(CLAVE_TOKEN_ADMIN),
      SecureStore.getItemAsync(CLAVE_EMAIL_ADMIN),
    ])
      .then(([tokenGuardado, emailGuardado]) => {
        if (!activo) return
        setToken(tokenGuardado)
        setEmail(emailGuardado || '')
      })
      .catch((error) => {
        console.error('No se pudo recuperar la sesión de administrador:', error)
      })
      .finally(() => {
        if (activo) setCargandoSesion(false)
      })
    return () => { activo = false }
  }, [])

  const login = useCallback(async (credenciales) => {
    const nuevoToken = await iniciarSesionAdministrador(credenciales)
    const emailNormalizado = credenciales.email.trim()
    await SecureStore.setItemAsync(CLAVE_TOKEN_ADMIN, nuevoToken)
    await SecureStore.setItemAsync(CLAVE_EMAIL_ADMIN, emailNormalizado)
    setToken(nuevoToken)
    setEmail(emailNormalizado)
  }, [])

  const cerrarSesion = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(CLAVE_TOKEN_ADMIN),
      SecureStore.deleteItemAsync(CLAVE_EMAIL_ADMIN),
    ])
    setToken(null)
    setEmail('')
  }, [])

  const value = useMemo(() => ({
    email,
    isAdmin: Boolean(token),
    cargandoSesion,
    login,
    cerrarSesion,
  }), [email, token, cargandoSesion, login, cerrarSesion])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  return context
}
