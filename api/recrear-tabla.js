import { getNeonClient } from './_neonClient.js';

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
    console.log('🔄 Recreando tabla productos...');
    
    const pool = getNeonClient();
    
    if (!pool) {
      console.error('No se pudo conectar a Neon');
      return res.status(500).json({ error: 'No se pudo conectar a Neon' });
    }

    // Eliminar tabla si existe
    await pool.query('DROP TABLE IF EXISTS productos');
    console.log('✅ Tabla productos eliminada');
    
    // Crear tabla con los tipos de datos correctos
    const createTableQuery = `
      CREATE TABLE productos (
        id INTEGER PRIMARY KEY,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        precio TEXT,
        categoria TEXT,
        imagen TEXT,
        stock TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Tabla productos recreada con tipos de datos correctos');
    
    return res.json({
      success: true,
      message: 'Tabla productos recreada exitosamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error recreando tabla:', error);
    return res.status(500).json({
      error: 'Error recreando tabla',
      details: error.message,
      success: false
    });
  }
}
