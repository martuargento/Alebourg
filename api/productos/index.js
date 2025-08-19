import { getSupabaseServerClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
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
    const wantDebug = req.query.debug === '1' || req.query.debug === 'true';
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
        if (wantDebug) {
          return res.json({ source: 'supabase', count: (data ?? []).length, paged: true, pageParam, pageSizeParam });
        }
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
          if (wantDebug) {
            return res.json({ source: 'supabase', count: data.length, paged: false });
          }
          return res.json(data);
        }
      }
    }
    
    // Si llegamos aquí, no hay datos de Supabase
    return res.status(500).json({ error: 'No se pudo obtener productos desde Supabase' });
  } catch (err) {
    console.error('Error al leer desde Supabase:', err.message);
    console.log('[Backend] Error completo:', err);
    return res.status(500).json({ error: 'Error al conectar con Supabase', detail: err.message });
  }
}
