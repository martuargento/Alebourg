const { prisma } = require('../lib/prisma');

function serializarProducto(producto) {
  return {
    ...producto,
    precio: String(producto.precio),
    categoria: String(producto.categoria || '').toLowerCase().trim(),
  };
}

function ordenarProductos(productos) {
  const personalizados = productos
    .filter((producto) => producto.orden > 0)
    .sort((a, b) => a.orden - b.orden || a.id - b.id);
  const sinOrden = productos
    .filter((producto) => producto.orden <= 0)
    .sort((a, b) => a.id - b.id);
  const ordenados = [];
  let posicion = 1;
  for (const producto of personalizados) {
    while (posicion < producto.orden && sinOrden.length > 0) {
      ordenados.push(sinOrden.shift());
      posicion += 1;
    }
    ordenados.push(producto);
    posicion = producto.orden + 1;
  }
  return [...ordenados, ...sinOrden];
}

async function listaDeProductos(req, res) {
  const productos = await prisma.producto.findMany({
    orderBy: [{ orden: 'asc' }, { id: 'asc' }],
  });
  if (req.query.debug === '1' || req.query.debug === 'true') {
    return res.json({
      source: process.env.NODE_ENV === 'production' ? 'postgresql' : 'sqlite-local',
      count: productos.length,
      totalInDb: productos.length,
    });
  }
  return res.json(ordenarProductos(productos).map(serializarProducto));
}

async function obtenerProducto(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
  return res.json(serializarProducto(producto));
}

module.exports = {
  listaDeProductos,
  obtenerProducto,
};
