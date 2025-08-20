import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    console.log('[Debug JSON] Verificando archivo JSON...');
    
    // Leer el archivo JSON desde el sistema de archivos
    const jsonPath = path.join(process.cwd(), 'productosalebourgactulizados.json');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(jsonPath)) {
      return res.json({
        error: 'Archivo JSON no encontrado',
        path: jsonPath,
        exists: false
      });
    }

    // Obtener estadísticas del archivo
    const stats = fs.statSync(jsonPath);
    const fileSize = stats.size;
    
    // Leer el archivo
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const productosData = JSON.parse(jsonData);
    
    // Contar productos
    const productCount = productosData.length;
    
    // Obtener algunos productos de ejemplo
    const sampleProducts = productosData.slice(0, 5);
    
    // Obtener el último producto
    const lastProduct = productosData[productosData.length - 1];
    
    return res.json({
      success: true,
      filePath: jsonPath,
      fileSize: fileSize,
      fileSizeMB: (fileSize / 1024 / 1024).toFixed(2),
      productCount: productCount,
      sampleProducts: sampleProducts,
      lastProduct: lastProduct,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Debug JSON] Error:', error);
    return res.status(500).json({
      error: 'Error al leer archivo JSON',
      details: error.message,
      success: false
    });
  }
}
