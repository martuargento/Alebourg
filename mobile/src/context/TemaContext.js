import { createContext, useContext } from 'react'
import { colores as coloresClaros } from '../theme/colores'

const TemaContext = createContext(null)

export function TemaProvider({ children }) {
  return (
    <TemaContext.Provider value={{ colores: coloresClaros }}>
      {children}
    </TemaContext.Provider>
  )
}

export function useTema() {
  const context = useContext(TemaContext)
  if (!context) throw new Error('useTema debe utilizarse dentro de TemaProvider.')
  return context
}
