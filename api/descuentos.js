import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const descuentosPath = path.join(process.cwd(), 'src', 'utils', 'descuentos.json');

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(descuentosPath)) {
        const data = fs.readFileSync(descuentosPath, 'utf8');
        res.json(JSON.parse(data));
      } else {
        res.json([]); // Si no existe, devolver vacío
      }
    } catch (err) {
      res.status(500).json({ error: 'No se pudo leer descuentos.' });
    }
  } else if (req.method === 'POST') {
    const reglas = req.body;
    if (!Array.isArray(reglas)) {
      return res.status(400).json({ error: 'Formato inválido' });
    }
    
    try {
      fs.writeFileSync(descuentosPath, JSON.stringify(reglas, null, 2));
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'No se pudo guardar descuentos.' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}
