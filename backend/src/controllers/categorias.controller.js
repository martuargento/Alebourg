const { prisma } = require('../lib/prisma');

async function listaDeCategorias(req, res) {
  const [base, productosAdmin] = await Promise.all([
    prisma.producto.findMany({ select: { id: true, categoria: true } }),
    prisma.productoAdmin.findMany({
      select: { id: true, categoria: true, manual: true },
    }),
  ]);
  const personalizacionesPorId = new Map(
    productosAdmin.map((producto) => [producto.id, producto]),
  );
  const productosPorId = new Map(base.map((producto) => {
    const personalizacion = personalizacionesPorId.get(producto.id);
    return [producto.id, {
      categoria: personalizacion?.categoria ?? producto.categoria,
    }];
  }));
  productosAdmin.forEach((producto) => {
    if (producto.manual) {
      productosPorId.set(producto.id, { categoria: producto.categoria });
    }
  });

  const conteo = new Map();
  for (const producto of productosPorId.values()) {
    const nombreOriginal = String(producto.categoria || '').trim();
    if (nombreOriginal) conteo.set(nombreOriginal, (conteo.get(nombreOriginal) || 0) + 1);
  }

  const categorias = Array.from(conteo, ([nombreOriginal, cantidad]) => ({
    nombre: nombreOriginal.replace(/([A-Z])/g, ' $1').trim(),
    nombreOriginal,
    cantidad,
  })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  return res.json(categorias);
}

module.exports = { listaDeCategorias };
