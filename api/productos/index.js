import { getSupabaseClient } from '../_supabaseClient.js';

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

  // Intentar leer desde Neon si está configurado
  console.log('[Backend] Request query:', req.query);
  console.log('[Backend] Debug param:', req.query.debug);
  
  try {
    const supabase = getSupabaseClient();
    console.log('[Backend] Supabase client:', supabase ? 'OK' : 'NULL');
    
    const wantDebug = req.query.debug === '1' || req.query.debug === 'true';
    console.log('[Backend] Debug mode:', wantDebug, 'query:', req.query);
    
    if (supabase) {
      // Si es debug, devolver solo el conteo
      if (wantDebug) {
        const { count: totalCount, error: countError } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('Error contando productos:', countError);
          return res.status(500).json({ error: 'Error contando productos' });
        }
        
        const { data: productos, error: productosError } = await supabase
          .from('productos')
          .select('*');
        
        if (productosError) {
          console.error('Error obteniendo productos:', productosError);
          return res.status(500).json({ error: 'Error obteniendo productos' });
        }
        
        return res.json({ 
          source: 'SUPABASE_MIGRADO', 
          count: productos?.length || 0, 
          totalInDb: totalCount || 0
        });
      }
      
      // Obtener todos los productos sin límite de paginación
      console.log('[Backend] Obteniendo todos los productos desde Supabase...');
      
      const { data: allProductos, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .order('id');
      
      if (productosError) {
        console.error('Error obteniendo productos:', productosError);
        return res.status(500).json({ error: 'Error obteniendo productos desde Supabase' });
      }
      
      console.log(`[Backend] Total de productos obtenidos de Supabase: ${allProductos.length}`);
      
      // Sanitizar campos críticos
      const sane = allProductos
        .filter(p => p && typeof p.id !== 'undefined' && p.titulo)
        .map(p => ({
          ...p,
          categoria: (p.categoria || '').toString().toLowerCase().trim(),
          precio: (p.precio || 0).toString(),
          stock: 0 // Supabase no tiene campo stock, usar 0 por defecto
        }));
      
      return res.json(sane);
    }
    
    // Si llegamos aquí, no hay datos de Supabase
    return res.status(500).json({ error: 'No se pudo obtener productos desde Supabase' });
  } catch (err) {
    console.error('Error al leer desde Supabase:', err.message);
    console.log('[Backend] Error completo:', err);
    return res.status(500).json({ error: 'Error al conectar con Supabase', detail: err.message });
  }
}
