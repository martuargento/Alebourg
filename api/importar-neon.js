import { getNeonClient } from './_neonClient.js';
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
    console.log('🔄 Iniciando importación de productos...');
    
    const pool = getNeonClient();
    
    if (!pool) {
      console.error('No se pudo conectar a Neon');
      return res.status(500).json({ error: 'No se pudo conectar a Neon' });
    }

    // Leer el archivo JSON
    const jsonPath = path.join(process.cwd(), 'productosalebourgactulizados.json');
    const productosData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log('🔄 Limpiando tabla productos...');
    
    // Limpiar tabla productos
    await pool.query('DELETE FROM productos');
    console.log('✅ Tabla productos limpiada');
    
    console.log(`📦 Importando ${productosData.length} productos...`);
    
    // Insertar productos en lotes para evitar timeouts
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < productosData.length; i += batchSize) {
      const batch = productosData.slice(i, i + batchSize);
      
      for (const producto of batch) {
                 // Formatear precio como string con coma y espacio al final
         let precioFormateado = producto.precio;
         if (typeof precioFormateado === 'string') {
           // Si ya tiene coma, asegurar que termine con espacio
           if (precioFormateado.includes(',')) {
             precioFormateado = precioFormateado.trim() + ' ';
           } else {
             // Si no tiene coma, convertir punto a coma y agregar espacio
             precioFormateado = precioFormateado.replace('.', ',') + ' ';
           }
         } else {
           // Si es número, convertir a string con coma y espacio
           precioFormateado = producto.precio.toString().replace('.', ',') + ' ';
         }
        
        const query = `
          INSERT INTO productos (id, titulo, descripcion, precio, categoria, imagen, stock, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
                 const values = [
           producto.id,
           producto.titulo,
           producto.descripcion || '',
           precioFormateado,
           producto.categoria || '',
           producto.imagen || '',
           (producto.stock || 0).toString(),
           new Date().toISOString(),
           new Date().toISOString()
         ];
        
        await pool.query(query, values);
        insertedCount++;
      }
      
      console.log(`✅ Lote completado: ${insertedCount}/${productosData.length} productos`);
    }
    
    console.log(`🎉 Importación completada: ${insertedCount} productos importados`);
    
    // Verificar la importación
    const countResult = await pool.query('SELECT COUNT(*) FROM productos');
    const finalCount = parseInt(countResult.rows[0].count);
    
    console.log(`📊 Total de productos en la base de datos: ${finalCount}`);
    
    return res.json({
      success: true,
      message: 'Importación completada exitosamente',
      importedCount: insertedCount,
      finalCount: finalCount,
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
