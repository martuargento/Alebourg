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

  // Intentar leer desde Supabase si está configurado
  try {
    const supabase = getSupabaseServerClient();
    console.log('[Backend] Supabase client:', supabase ? 'OK' : 'NULL');
    if (supabase) {
      const pageParam = parseInt(req.query.page ?? '');
      const pageSizeParam = parseInt(req.query.pageSize ?? '');
      const usePaging = Number.isFinite(pageParam) && Number.isFinite(pageSizeParam) && pageSizeParam > 0;

      if (usePaging) {
        const from = pageParam * pageSizeParam;
        const to = from + pageSizeParam - 1;
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .order('id', { ascending: true })
          .range(from, to);
        if (error) throw error;
        return res.json(data ?? []);
      } else {
        // Traer todo sin paginado (más confiable)
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .order('id', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          console.log('[Backend] Productos desde Supabase:', data.length);
          return res.json(data);
        }
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
    console.log('[Backend] Productos desde JSON local:', productos.length);
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer productos.' });
  }
}
