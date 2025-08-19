import { getSupabaseServerClient } from './_supabaseClient.js';

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

  try {
    const supabase = getSupabaseServerClient();
    
    if (!supabase) {
      return res.json({ error: 'No se pudo conectar con Supabase' });
    }

    // Query para contar total
    const { count, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    
    // Query para traer todos
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .limit(10000);
    
    return res.json({ 
      source: 'supabase', 
      count: data?.length || 0, 
      totalInDb: count || 0,
      error: error?.message || countError?.message
    });
    
  } catch (err) {
    return res.json({ error: err.message });
  }
}
