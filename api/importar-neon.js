import { getNeonClient } from './_neonClient.js';
import productosData from '../productosalebourgactulizados.json' assert { type: 'json' };

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

    // Insertar productos en lotes de 100
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < productos.length; i += batchSize) {
      const batch = productos.slice(i, i + batchSize);
      
      const values = batch.map((producto, index) => {
        const offset = i + index;
        return `($${offset * 6 + 1}, $${offset * 6 + 2}, $${offset * 6 + 3}, $${offset * 6 + 4}, $${offset * 6 + 5}, $${offset * 6 + 6})`;
      }).join(', ');

      const query = `
        INSERT INTO productos (id, titulo, descripcion, precio, categoria, imagen, stock)
        VALUES ${values}
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
