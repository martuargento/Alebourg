import { getNeonClient } from '../_neonClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Intentar leer desde Neon si está configurado
  console.log('[Backend] Request query:', req.query);
  console.log('[Backend] Debug param:', req.query.debug);
  
  try {
    const pool = getNeonClient();
    console.log('[Backend] Neon client:', pool ? 'OK' : 'NULL');
    
    const wantDebug = req.query.debug === '1' || req.query.debug === 'true';
    console.log('[Backend] Debug mode:', wantDebug, 'query:', req.query);
    
    if (pool) {
      // Si es debug, devolver solo el conteo
      if (wantDebug) {
        const countResult = await pool.query('SELECT COUNT(*) FROM productos');
        const totalCount = parseInt(countResult.rows[0].count);
        
        const productosResult = await pool.query('SELECT * FROM productos LIMIT 1000');
        const productos = productosResult.rows;
        
        return res.json({ 
          source: 'neon', 
          count: productos?.length || 0, 
          totalInDb: totalCount || 0
        });
      }
      
      // Obtener todos los productos sin límite de paginación
      console.log('[Backend] Obteniendo todos los productos desde Neon...');
      
      const productosResult = await pool.query('SELECT * FROM productos ORDER BY id');
      const allProductos = productosResult.rows;
      
      console.log(`[Backend] Total de productos obtenidos de Neon: ${allProductos.length}`);
      
      // Sanitizar campos críticos
      const sane = allProductos
        .filter(p => p && typeof p.id !== 'undefined' && p.titulo)
        .map(p => ({
          ...p,
          categoria: (p.categoria || '').toString().toLowerCase().trim(),
          precio: (p.precio || 0).toString().replace(',', '.') + ' ',
          stock: parseInt(p.stock) || 0
        }));
      
      return res.json(sane);
    }
    
    // Si llegamos aquí, no hay datos de Neon
    return res.status(500).json({ error: 'No se pudo obtener productos desde Neon' });
  } catch (err) {
    console.error('Error al leer desde Neon:', err.message);
    console.log('[Backend] Error completo:', err);
    return res.status(500).json({ error: 'Error al conectar con Neon', detail: err.message });
  }
}
