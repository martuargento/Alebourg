import { getNeonClient } from './_neonClient.js';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
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
    console.log('[Importar Neon] Iniciando importación...');
    
    const pool = getNeonClient();
    
    // Leer el archivo JSON desde el sistema de archivos
    const jsonPath = path.join(process.cwd(), 'productosalebourgactulizados.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const productosData = JSON.parse(jsonData);
    
    console.log(`[Importar Neon] Archivo JSON leído: ${productosData.length} productos`);
    
    // Limpiar tabla existente
    await pool.query('DELETE FROM productos');
    console.log('[Importar Neon] Tabla limpiada');
    
    // Preparar productos para inserción
    const productos = productosData.map(producto => ({
      id: producto.id,
      titulo: producto.titulo || '',
      descripcion: producto.descripcion || '',
      precio: parseFloat(producto.precio) || 0,
      categoria: producto.categoria || '',
      imagen: producto.imagen || '',
      stock: parseInt(producto.stock) || 0
    }));

    console.log(`[Importar Neon] Preparando ${productos.length} productos para importar`);

    // Insertar productos en lotes de 50 (reducido para evitar timeouts)
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < productos.length; i += batchSize) {
      const batch = productos.slice(i, i + batchSize);
      
      // Crear query dinámico para cada lote
      const placeholders = batch.map((_, index) => {
        const offset = index * 7;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
      }).join(', ');

      const query = `
        INSERT INTO productos (id, titulo, descripcion, precio, categoria, imagen, stock)
        VALUES ${placeholders}
        ON CONFLICT (id) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          descripcion = EXCLUDED.descripcion,
          precio = EXCLUDED.precio,
          categoria = EXCLUDED.categoria,
          imagen = EXCLUDED.imagen,
          stock = EXCLUDED.stock,
          updated_at = CURRENT_TIMESTAMP
      `;

      const params = batch.flatMap(producto => [
        producto.id,
        producto.titulo,
        producto.descripcion,
        producto.precio,
        producto.categoria,
        producto.imagen,
        producto.stock
      ]);

      await pool.query(query, params);
      insertedCount += batch.length;
      console.log(`[Importar Neon] Lote ${Math.floor(i / batchSize) + 1} completado: ${insertedCount}/${productos.length}`);
    }

    // Verificar importación
    const countResult = await pool.query('SELECT COUNT(*) FROM productos');
    const finalCount = parseInt(countResult.rows[0].count);

    console.log(`[Importar Neon] Importación completada: ${finalCount} productos`);

    return res.json({
      success: true,
      message: 'Importación completada exitosamente',
      importedCount: insertedCount,
      finalCount: finalCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Importar Neon] Error:', error);
    return res.status(500).json({
      error: 'Error en la importación',
      details: error.message,
      success: false
    });
  }
}
