import fs from 'fs';
import path from 'path';
import { getSupabaseServerClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id } = req.query;

  // Intentar leer desde Supabase si está configurado
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', parseInt(id))
        .limit(1)
        .single();
      if (error) throw error;
      if (data) {
        return res.json(data);
      }
    }
  } catch (err) {
    console.warn('Supabase no disponible o error al leer, usando JSON local. Detalle:', err.message);
  }

  // Fallback al JSON local
  const productosPath = path.join(process.cwd(), 'public', 'productosalebourgactulizados.json');

  try {
    if (!fs.existsSync(productosPath)) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const data = fs.readFileSync(productosPath, 'utf8');
    const productos = JSON.parse(data);
    const producto = productos.find(p => p.id === parseInt(id));

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer productos.' });
  }
}
