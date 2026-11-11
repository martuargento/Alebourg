import api from './client'

export async function iniciarSesionAdministrador({ email, password }) {
  const { data } = await api.post('/api/auth/login', { email, password })
  if (!data.access) {
    throw new Error('La respuesta de autenticación no incluye un token.')
  }
  return data.access
}
