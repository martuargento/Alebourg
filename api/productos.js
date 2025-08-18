import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const productosPath = path.join(process.cwd(), 'public', 'productosalebourgactulizados.json');

  try {
    if (!fs.existsSync(productosPath)) {
      return res.json([]); // Si no existe, devolver vacío
    }

    const data = fs.readFileSync(productosPath, 'utf8');
    const productos = JSON.parse(data);

    // Si hay un ID específico en la URL
    if (req.query.id) {
      const id = parseInt(req.query.id);
      const producto = productos.find(p => p.id === id);
      if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      return res.json(producto);
    }

    // Si no hay ID, devolver todos los productos
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer productos.' });
  }
}
