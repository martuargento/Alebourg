const { prisma } = require('../lib/prisma');

async function listaDeCategorias(req, res) {
  const [base, personalizaciones] = await Promise.all([
    prisma.producto.findMany({ select: { id: true, categoria: true } }),
    prisma.appSetting.findMany({
      where: { key: { startsWith: 'producto-admin:' } },
      select: { value: true },
    }),
  ]);
  const personalizacionesPorId = new Map(
    personalizaciones.map((fila) => {
      try {
        const producto = JSON.parse(fila.value);
        return [Number(producto.id), producto];
      } catch {
        throw new Error('Hay una personalización de producto dañada.');
      }
    }),
  );
  const productosPorId = new Map(base.map((producto) => {
    const personalizacion = personalizacionesPorId.get(producto.id);
    return [producto.id, {
      categoria: personalizacion?.categoria ?? producto.categoria,
    }];
  }));
  personalizacionesPorId.forEach((personalizacion) => {
    if (personalizacion.manual) {
      productosPorId.set(Number(personalizacion.id), { categoria: personalizacion.categoria });
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
