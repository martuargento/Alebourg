import { getSupabaseAdminClient } from '../../_supabaseClient.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const supabase = getSupabaseAdminClient();

    // Resetear todos los valores de orden a 0
    const { error: updateError } = await supabase
      .from('productos')
      .update({ orden: 0 });

    if (updateError) {
      console.error('Error reseteando orden:', updateError);
      return res.status(500).json({ error: 'Error reseteando orden en Supabase' });
    }

    // Obtener el total de productos actualizados
    const { count } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });

    console.log(`[Backend] Orden reseteado para ${count} productos`);

    return res.status(200).json({
      success: true,
      message: 'Orden reseteado exitosamente',
      productosActualizados: count
    });

  } catch (err) {
    console.error('Error en reset-order:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
