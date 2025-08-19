import fs from 'fs';
import path from 'path';
import { getSupabaseServerClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
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

  // Intentar leer desde Supabase si está configurado
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      // Paginado para evitar límite de filas por request en PostgREST
      const pageSize = 1000;
      let allRows = [];
      let from = 0;
      while (true) {
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .order('id', { ascending: true })
          .range(from, to);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allRows = allRows.concat(data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      if (allRows.length > 0) {
        return res.json(allRows);
      }
    }
  } catch (err) {
    console.warn('Supabase no disponible o error al leer, usando JSON local. Detalle:', err.message);
  }

  // Fallback al JSON local
  const productosPath = path.join(process.cwd(), 'public', 'productosalebourgactulizados.json');

  try {
    if (!fs.existsSync(productosPath)) {
      return res.json([]);
    }

    const data = fs.readFileSync(productosPath, 'utf8');
    const productos = JSON.parse(data);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer productos.' });
  }
}
