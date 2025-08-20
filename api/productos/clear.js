import { getSupabaseAdminClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(500).json({ error: 'No se pudo conectar con Supabase' });
    }

    console.log('[Backend] Limpiando todos los productos de Supabase...');

    // Eliminar todos los productos
    const { error: deleteError } = await supabase
      .from('productos')
      .delete()
      .neq('id', 0); // Eliminar todos los registros

    if (deleteError) {
      console.error('Error eliminando productos:', deleteError);
      return res.status(500).json({ error: 'Error eliminando productos', detail: deleteError.message });
    }

    console.log('[Backend] Productos eliminados exitosamente');

    // Verificar que se eliminaron todos
    const { count: remainingCount, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error contando productos restantes:', countError);
    } else {
      console.log(`[Backend] Productos restantes en Supabase: ${remainingCount || 0}`);
    }

    return res.json({ 
      success: true, 
      message: 'Todos los productos han sido eliminados',
      remainingCount: remainingCount || 0
    });

  } catch (err) {
    console.error('Error al limpiar productos:', err.message);
    return res.status(500).json({ error: 'Error al limpiar productos', detail: err.message });
  }
}
