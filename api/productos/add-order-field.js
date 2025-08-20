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

    console.log('[Backend] Agregando campo de orden a la tabla productos...');

    // Ejecutar SQL para agregar el campo orden
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE productos 
        ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;
        
        -- Crear índice para mejorar el rendimiento del ordenamiento
        CREATE INDEX IF NOT EXISTS idx_productos_orden ON productos(orden);
      `
    });

    if (sqlError) {
      console.error('Error ejecutando SQL:', sqlError);
      
      // Si falla el RPC, intentar con una consulta simple
      console.log('[Backend] Intentando método alternativo...');
      
      // Verificar si el campo ya existe
      const { data: columns, error: columnsError } = await supabase
        .from('productos')
        .select('*')
        .limit(1);
      
      if (columnsError) {
        return res.status(500).json({ error: 'Error verificando estructura de tabla', detail: columnsError.message });
      }
      
      // Si llegamos aquí, el campo ya existe o no se pudo agregar
      console.log('[Backend] Campo de orden ya existe o no se pudo agregar automáticamente');
    } else {
      console.log('[Backend] Campo de orden agregado exitosamente');
    }

    // Verificar que el campo existe
    const { data: testData, error: testError } = await supabase
      .from('productos')
      .select('orden')
      .limit(1);

    if (testError) {
      console.error('Error verificando campo orden:', testError);
      return res.status(500).json({ error: 'Campo de orden no disponible', detail: testError.message });
    }

    console.log('[Backend] Campo de orden verificado correctamente');

    return res.json({ 
      success: true, 
      message: 'Campo de orden agregado/verificado exitosamente',
      fieldAvailable: true
    });

  } catch (err) {
    console.error('Error al agregar campo de orden:', err.message);
    return res.status(500).json({ error: 'Error al agregar campo de orden', detail: err.message });
  }
}
