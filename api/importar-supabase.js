import { getSupabaseClient } from './_supabaseClient.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('🔄 Iniciando importación a Supabase...');
    
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.error('No se pudo conectar a Supabase');
      return res.status(500).json({ error: 'No se pudo conectar a Supabase' });
    }

    // Leer el archivo JSON
    const jsonPath = path.join(process.cwd(), 'productosalebourgactulizados.json');
    const productosData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log('🔄 Limpiando tabla productos en Supabase...');
    
    // Limpiar tabla productos
    const { error: deleteError } = await supabase
      .from('productos')
      .delete()
      .neq('id', 0); // Eliminar todos los registros
    
    if (deleteError) {
      console.error('Error limpiando tabla:', deleteError);
      return res.status(500).json({ error: 'Error limpiando tabla', details: deleteError.message });
    }
    
    console.log('✅ Tabla productos limpiada');
    
    console.log(`📦 Importando ${productosData.length} productos...`);
    
    // Preparar datos para inserción (solo los 5 campos que necesitas)
    const productosParaInsertar = productosData.map(producto => ({
      id: producto.id,
      titulo: producto.titulo,
      imagen: producto.imagen || '',
      precio: producto.precio,
      categoria: producto.categoria || ''
    }));
    
    // Insertar productos en lotes para evitar timeouts
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < productosParaInsertar.length; i += batchSize) {
      const batch = productosParaInsertar.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('productos')
        .insert(batch);
      
      if (error) {
        console.error('Error insertando lote:', error);
        return res.status(500).json({ 
          error: 'Error insertando productos', 
          details: error.message,
          insertedCount: insertedCount
        });
      }
      
      insertedCount += batch.length;
      console.log(`✅ Lote completado: ${insertedCount}/${productosData.length} productos`);
    }
    
    console.log(`🎉 Importación completada: ${insertedCount} productos importados`);
    
    // Verificar la importación
    const { count, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error contando productos:', countError);
    } else {
      console.log(`📊 Total de productos en Supabase: ${count}`);
    }
    
    return res.json({
      success: true,
      message: 'Importación completada exitosamente',
      importedCount: insertedCount,
      finalCount: count || insertedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    return res.status(500).json({
      error: 'Error en la importación',
      details: error.message,
      success: false
    });
  }
}
