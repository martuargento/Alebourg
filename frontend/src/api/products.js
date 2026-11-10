import api from './client';
import { parsearPrecio } from '../utils/preciosUtils';

function validarProducto(producto) {
  if (
    !producto
    || !Number.isSafeInteger(Number(producto.id))
    || Number(producto.id) <= 0
    || !String(producto.titulo || '').trim()
  ) {
    throw new Error('La base de datos devolvió un producto inválido.');
  }
  parsearPrecio(producto.precio);
  return {
    ...producto,
    categoria: String(producto.categoria || ''),
    titulo: String(producto.titulo),
  };
}

export async function obtenerProductos() {
  const { data } = await api.get('/productos');
  if (!Array.isArray(data)) {
    throw new Error('La API devolvió un catálogo de productos inválido.');
  }

  return data.map(validarProducto);
}

export async function obtenerProducto(id) {
  const { data } = await api.get(`/productos/${id}`);
  return validarProducto(data);
}

export async function obtenerCategorias() {
  const { data } = await api.get('/categorias');
  return data;
}

export function obtenerErrorApi(error, fallback) {
  const detalles = Object.values(error.response?.data?.details || {}).flat();
  return error.response?.data?.error
    || error.response?.data?.detail
    || detalles[0]
    || fallback;
}
