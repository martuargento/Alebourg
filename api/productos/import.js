import fs from 'fs';
import path from 'path';
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

    console.log('[Backend] Importando productos desde JSON a Supabase...');

    // Leer el archivo JSON
    const jsonPath = path.join(process.cwd(), 'productosalebourgactualizados.json');
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'Archivo productosalebourgactualizados.json no encontrado' });
    }

    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    const productos = JSON.parse(jsonContent);

    if (!Array.isArray(productos)) {
      return res.status(400).json({ error: 'El archivo JSON no contiene un array válido' });
    }

    console.log(`[Backend] Productos a importar: ${productos.length}`);

    // Preparar productos para Supabase
    const productosParaImportar = productos
      .filter(p => p && typeof p.id !== 'undefined' && p.titulo)
      .map(p => ({
        id: p.id,
        titulo: p.titulo,
        categoria: (p.categoria || '').toString().toLowerCase().trim(),
        precio: (p.precio || 0).toString(),
        imagen: p.imagen || '',
        descripcion: p.descripcion || '',
        stock: 0, // Valor por defecto para Supabase
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

    console.log(`[Backend] Productos válidos para importar: ${productosParaImportar.length}`);

    if (productosParaImportar.length === 0) {
      return res.status(400).json({ error: 'No hay productos válidos para importar' });
    }

    // Importar productos en lotes para evitar límites de tamaño
    const batchSize = 100;
    let totalImportados = 0;
    let errores = [];

    for (let i = 0; i < productosParaImportar.length; i += batchSize) {
      const batch = productosParaImportar.slice(i, i + batchSize);
      console.log(`[Backend] Importando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(productosParaImportar.length / batchSize)} (${batch.length} productos)`);

      try {
        const { error: insertError } = await supabase
          .from('productos')
          .insert(batch);

        if (insertError) {
          console.error(`Error en lote ${Math.floor(i / batchSize) + 1}:`, insertError);
          errores.push({
            lote: Math.floor(i / batchSize) + 1,
            error: insertError.message
          });
        } else {
          totalImportados += batch.length;
          console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} importado exitosamente`);
        }
      } catch (batchError) {
        console.error(`Error inesperado en lote ${Math.floor(i / batchSize) + 1}:`, batchError);
        errores.push({
          lote: Math.floor(i / batchSize) + 1,
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

    console.log(`[Backend] Importación completada. Total en Supabase: ${finalCount || 0}`);

    return res.json({
      success: true,
      message: 'Importación completada',
      totalEnJson: productos.length,
      totalValidos: productosParaImportar.length,
      totalImportados: totalImportados,
      totalEnSupabase: finalCount || 0,
      errores: errores,
      exitoso: errores.length === 0
    });

  } catch (err) {
    console.error('Error al importar productos:', err.message);
    return res.status(500).json({ error: 'Error al importar productos', detail: err.message });
  }
}
