export function parsearPrecio(precioStr) {
  const texto = String(precioStr ?? '').trim()
  if (!texto) throw new Error('La base de datos devolvió un producto sin precio.')

  const limpio = texto.replace(/[$,\s]/g, '')
  if (!/^\d+(\.\d+)?$/.test(limpio)) {
    throw new Error('La base de datos devolvió un precio inválido.')
  }

  const precio = Number(limpio)
  if (!Number.isFinite(precio)) throw new Error('La base de datos devolvió un precio inválido.')
  return precio
}

function redondearA500(precio) {
  return Math.floor(precio / 500) * 500
}

export function ajustarPrecio(precioOriginal, titulo = '', categoria = '', configuracion) {
  if (!configuracion) throw new Error('La configuración de precios no está disponible.')

  const precio = parsearPrecio(precioOriginal)
  const { rangos, ajusteEspecial, minimoAuriculares } = configuracion

  if (
    ajusteEspecial
    && titulo.toLowerCase().startsWith(ajusteEspecial.prefijoTitulo)
    && precio < ajusteEspecial.limite
  ) {
    return redondearA500(precio + ajusteEspecial.monto)
  }

  const rango = rangos.find((regla) => (
    regla.mayorIgual ? precio >= regla.limite : precio < regla.limite
  ))
  const precioAjustado = precio + (rango?.monto || 0)

  if (
    String(categoria || '').trim().toLowerCase() === 'auriculares'
    && redondearA500(precioAjustado) < minimoAuriculares
  ) {
    return minimoAuriculares
  }

  return redondearA500(precioAjustado)
}

export function obtenerPrecioFinal(producto, configuracion) {
  return producto.precioFinal == null
    ? ajustarPrecio(producto.precio, producto.titulo, producto.categoria, configuracion)
    : parsearPrecio(producto.precioFinal)
}
