import api from './client';

export async function obtenerConfiguracionProductos() {
  const { data } = await api.get('/productos/admin/config');
  return data;
}

export async function guardarConfiguracionProductos(configuracion) {
  const { data } = await api.put('/productos/admin/config', configuracion);
  return data;
}

export async function guardarEdicionProducto(id, cambios) {
  const { data } = await api.put(`/productos/${id}/admin`, cambios);
  return data;
}

export async function crearProductoManual(producto) {
  const { data } = await api.post('/productos/admin/productos', producto);
  return data;
}

export async function eliminarProducto(id) {
  const { data } = await api.delete(`/productos/${id}/admin`);
  return data;
}

export async function marcarProductoRevisado(id) {
  const { data } = await api.post(`/productos/${id}/revisado`);
  return data;
}

export async function subirImagenProducto(id, archivo) {
  const { data } = await api.post(`/productos/${id}/imagenes`, archivo, {
    headers: { 'Content-Type': archivo.type },
    timeout: 60000,
  });
  return data.url;
}

export async function obtenerProductosDestacados() {
  const { data } = await api.get('/productos/destacados');
  return data;
}
