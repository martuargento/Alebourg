import api from './client';

export async function iniciarSesion({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  if (!data.access) {
    throw new Error('La respuesta de autenticación no incluye un token.');
  }

  localStorage.setItem('admin_token', data.access);
  return { access: data.access, email };
}

export function cerrarSesion() {
  localStorage.removeItem('admin_token');
}
