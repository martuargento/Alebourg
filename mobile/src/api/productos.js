import api from './client'
import { parsearPrecio } from '../utils/precios'

function validarProducto(producto) {
  if (
    !producto
    || !Number.isSafeInteger(Number(producto.id))
    || Number(producto.id) === 0
    || !String(producto.titulo || '').trim()
  ) {
    throw new Error('La API devolvió un producto inválido.')
  }
  parsearPrecio(producto.precio)
  return {
    ...producto,
    id: Number(producto.id),
    titulo: String(producto.titulo),
    categoria: String(producto.categoria || ''),
    imagen: String(producto.imagen || ''),
    imagenes: Array.isArray(producto.imagenes)
      ? producto.imagenes.map(String)
      : producto.imagen ? [String(producto.imagen)] : [],
    precioFinal: producto.precioFinal == null ? null : String(producto.precioFinal),
  }
}

export async function obtenerProductos() {
  const { data } = await api.get('/api/productos')
  if (!Array.isArray(data)) throw new Error('La API devolvió un catálogo inválido.')
  return data.map(validarProducto)
}

export async function obtenerProducto(id) {
  const { data } = await api.get(`/api/productos/${id}`)
  return validarProducto(data)
}

export async function obtenerCategorias() {
  const { data } = await api.get('/api/categorias')
  if (!Array.isArray(data)) throw new Error('La API devolvió categorías inválidas.')
  return data
}
