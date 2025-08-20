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

    console.log('[Backend] Actualizando valores de orden para productos...');

    // Obtener todos los productos ordenados por ID
    const { data: productos, error: fetchError } = await supabase
      .from('productos')
      .select('id')
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('Error obteniendo productos:', fetchError);
      return res.status(500).json({ error: 'Error obteniendo productos', detail: fetchError.message });
    }

    if (!productos || productos.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No hay productos para actualizar',
        updatedCount: 0
      });
    }

    console.log(`[Backend] Productos encontrados: ${productos.length}`);

    // Actualizar valores de orden en lotes
    const batchSize = 100;
    let totalActualizados = 0;
    let errores = [];

    for (let i = 0; i < productos.length; i += batchSize) {
      const batch = productos.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`[Backend] Actualizando lote ${batchNumber}/${Math.ceil(productos.length / batchSize)} (${batch.length} productos)`);

      // Preparar actualizaciones para este lote
      const updates = batch.map((producto, index) => ({
        id: producto.id,
        orden: i + index + 1 // Orden secuencial basado en posición
      }));

      try {
        // Actualizar cada producto individualmente para evitar problemas de conflicto
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('productos')
            .update({ orden: update.orden })
            .eq('id', update.id);

          if (updateError) {
            console.error(`Error actualizando producto ${update.id}:`, updateError);
            errores.push({
              id: update.id,
              error: updateError.message
            });
          } else {
            totalActualizados++;
          }
        }

        console.log(`✅ Lote ${batchNumber} procesado exitosamente`);
      } catch (batchError) {
        console.error(`Error inesperado en lote ${batchNumber}:`, batchError);
        errores.push({
          lote: batchNumber,
          error: batchError.message
        });
      }
    }

    // Verificar resultado final
    const { count: finalCount, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error contando productos finales:', countError);
    }

    console.log(`[Backend] Actualización completada. Total en Supabase: ${finalCount || 0}`);

    return res.json({
      success: true,
      message: 'Valores de orden actualizados',
      totalProductos: productos.length,
      totalActualizados: totalActualizados,
      totalEnSupabase: finalCount || 0,
      errores: errores,
      exitoso: errores.length === 0
    });

  } catch (err) {
    console.error('Error al actualizar valores de orden:', err.message);
    return res.status(500).json({ error: 'Error al actualizar valores de orden', detail: err.message });
  }
}
