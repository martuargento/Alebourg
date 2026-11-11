import api from './client'

export async function obtenerConfiguracionProductos() {
  const { data } = await api.get('/api/productos/admin/config')
  return data
}

export async function guardarConfiguracionProductos(configuracion) {
  const { data } = await api.put('/api/productos/admin/config', configuracion)
  return data
}

export async function guardarEdicionProducto(id, cambios) {
  const { data } = await api.put(`/api/productos/${id}/admin`, cambios)
  return data
}

export async function crearProductoManual(producto) {
  const { data } = await api.post('/api/productos/admin/productos', producto)
  return data
}

export async function marcarProductoRevisado(id) {
  const { data } = await api.post(`/api/productos/${id}/revisado`)
  return data
}

export async function subirImagenProducto(id, archivo) {
  const respuesta = await fetch(archivo.uri)
  if (!respuesta.ok) throw new Error('No se pudo leer la imagen seleccionada.')
  const imagen = await respuesta.blob()
  const { data } = await api.post(`/api/productos/${id}/imagenes`, imagen, {
    headers: { 'Content-Type': archivo.mimeType || imagen.type || 'image/jpeg' },
    timeout: 60000,
  })
  return data.url
}

export async function obtenerProductosDestacados() {
  const { data } = await api.get('/api/productos/destacados')
  return data
}
