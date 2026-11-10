const { prisma } = require('../lib/prisma');

async function listaDeCategorias(req, res) {
  const productos = await prisma.producto.findMany({ select: { categoria: true } });
  const conteo = new Map();
  for (const producto of productos) {
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
