export const parsearPrecio = (precioStr) => {
  const str = String(precioStr ?? '').trim();
  if (!str) {
    throw new Error('La base de datos devolvió un producto sin precio.');
  }

  const precioLimpio = str.replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(precioLimpio)) {
    throw new Error('La base de datos devolvió un precio inválido.');
  }

  const resultado = Number(precioLimpio);
  if (!Number.isFinite(resultado)) {
    throw new Error('La base de datos devolvió un precio inválido.');
  }
  return resultado;
};

export const redondearA500 = (precio) => {
  return Math.floor(precio / 500) * 500;
};

export const ajustarPrecio = (precioOriginal, titulo = '', categoria = '', configuracion) => {
  if (!configuracion) {
    throw new Error('La configuración de precios no está disponible.');
  }

  const precio = parsearPrecio(precioOriginal);
  let precioAjustado = precio;
  const { rangos, ajusteEspecial, minimoAuriculares } = configuracion;
  const ajuste = ajusteEspecial;

  if (
    ajuste
    && titulo.toLowerCase().startsWith(ajuste.prefijoTitulo)
    && precio < ajuste.limite
  ) {
    precioAjustado += ajuste.monto;
    return redondearA500(precioAjustado);
  }
  const rango = rangos.find((regla) => (
    regla.mayorIgual ? precio >= regla.limite : precio < regla.limite
  ));
  if (rango) precioAjustado += rango.monto;

  // Lógica especial para auriculares
  if (
    categoria.trim().toLowerCase() === 'auriculares'
    && redondearA500(precioAjustado) < minimoAuriculares
  ) {
    return minimoAuriculares;
  }

  return redondearA500(precioAjustado);
};

export const obtenerPrecioFinal = (producto, configuracion) => (
  producto.precioFinal == null
    ? ajustarPrecio(producto.precio, producto.titulo, producto.categoria, configuracion)
    : parsearPrecio(producto.precioFinal)
);

export const formatearPrecio = (precio) => precio.toLocaleString('es-AR');
