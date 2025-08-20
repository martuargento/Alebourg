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

    console.log('[Debug] Iniciando diagnóstico de Supabase...');

    // 1. Query para contar total exacto
    console.log('[Debug] Contando total de registros...');
    const { count, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    
    console.log('[Debug] Total en DB:', count, 'Error:', countError?.message);

    // 2. Query con límite alto (como hace el frontend)
    console.log('[Debug] Probando query con límite 10000...');
    const { data: data1, error: error1 } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true })
      .limit(10000);
    
    console.log('[Debug] Query con limit(10000):', data1?.length, 'Error:', error1?.message);

    // 3. Query con paginación (como hace el frontend actualmente)
    console.log('[Debug] Probando paginación page=0, pageSize=5000...');
    const { data: data2, error: error2 } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true })
      .range(0, 4999);
    
    console.log('[Debug] Query con range(0,4999):', data2?.length, 'Error:', error2?.message);

    // 4. Query con límite por defecto
    console.log('[Debug] Probando query sin límite...');
    const { data: data3, error: error3 } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true });
    
    console.log('[Debug] Query sin límite:', data3?.length, 'Error:', error3?.message);

    // 5. Verificar si hay productos con IDs específicos
    console.log('[Debug] Verificando rango de IDs...');
    const { data: minMaxData, error: minMaxError } = await supabase
      .from('productos')
      .select('id')
      .order('id', { ascending: true });
    
    const ids = minMaxData?.map(p => p.id) || [];
    const minId = Math.min(...ids);
    const maxId = Math.max(...ids);
    const gaps = [];
    
    // Buscar gaps en los IDs
    for (let i = minId; i <= maxId; i++) {
      if (!ids.includes(i)) {
        gaps.push(i);
      }
    }

    return res.json({ 
      source: 'supabase', 
      totalInDb: count || 0,
      queries: {
        limit10000: { count: data1?.length || 0, error: error1?.message },
        range0to4999: { count: data2?.length || 0, error: error2?.message },
        noLimit: { count: data3?.length || 0, error: error3?.message }
      },
      idAnalysis: {
        minId,
        maxId,
        totalIds: ids.length,
        gaps: gaps.slice(0, 20), // Solo mostrar los primeros 20 gaps
        gapCount: gaps.length
      },
      errors: {
        countError: countError?.message,
        minMaxError: minMaxError?.message
      }
    });
    
  } catch (err) {
    console.error('[Debug] Error general:', err);
    return res.json({ error: err.message });
  }
}
