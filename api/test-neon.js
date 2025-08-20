import { getNeonClient, testNeonConnection } from './_neonClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    console.log('[Test Neon] Iniciando prueba de conexión...');
    
    // Probar conexión
    const connectionTest = await testNeonConnection();
    
    if (!connectionTest) {
      return res.status(500).json({ 
        error: 'No se pudo conectar con Neon',
        success: false 
      });
    }

    const pool = getNeonClient();
    
    // Crear tabla si no existe
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        categoria VARCHAR(100),
        imagen VARCHAR(500),
        stock INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTableQuery);
    console.log('[Test Neon] Tabla productos creada/verificada');

    // Contar productos
    const countResult = await pool.query('SELECT COUNT(*) FROM productos');
    const productCount = parseInt(countResult.rows[0].count);

    // Obtener algunos productos de ejemplo
    const sampleResult = await pool.query('SELECT * FROM productos LIMIT 5');
    
    return res.json({
      success: true,
      message: 'Conexión a Neon exitosa',
      connection: 'OK',
      tableCreated: true,
      productCount: productCount,
      sampleProducts: sampleResult.rows,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Test Neon] Error:', error);
    return res.status(500).json({
      error: 'Error en la prueba de Neon',
      details: error.message,
      success: false
    });
  }
}
