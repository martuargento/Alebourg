import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Configuración de Supabase
const supabaseUrl = 'https://ihlhkpmzqhbedixiwdrb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0Mjk5MywiZXhwIjoyMDcxMTE4OTkzfQ.Blixh0ykJ9F7lNxgle6dFzNzzx3OF_f3mfg5paOTsx8';

// Configuración de Neon (para leer los datos existentes)
const neonConfig = {
  host: process.env.NEON_HOST || 'your-neon-host',
  database: process.env.NEON_DATABASE || 'your-neon-database',
  user: process.env.NEON_USER || 'your-neon-user',
  password: process.env.NEON_PASSWORD || 'your-neon-password',
  ssl: true
};

// Crear cliente de Supabase con service role para permisos de escritura
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Crear cliente de Neon
const neonPool = new Pool(neonConfig);

async function migrarProductos() {
  try {
    console.log('🔄 Iniciando migración de Neon a Supabase...');
    
    // 1. Crear tabla en Supabase si no existe
    console.log('📋 Creando tabla productos en Supabase...');
    const { error: createError } = await supabase.rpc('create_productos_table_if_not_exists');
    
    if (createError) {
      console.log('⚠️  La tabla ya existe o hubo un error:', createError.message);
    }
    
    // 2. Leer productos desde Neon
    console.log('📖 Leyendo productos desde Neon...');
    const neonClient = await neonPool.connect();
    const neonResult = await neonClient.query('SELECT * FROM productos ORDER BY id');
    const productos = neonResult.rows;
    neonClient.release();
    
    console.log(`📊 Encontrados ${productos.length} productos en Neon`);
    
    if (productos.length === 0) {
      console.log('❌ No hay productos para migrar');
      return;
    }
    
    // 3. Limpiar tabla en Supabase (opcional)
    console.log('🧹 Limpiando tabla en Supabase...');
    const { error: deleteError } = await supabase
      .from('productos')
      .delete()
      .neq('id', 0); // Eliminar todos los registros
    
    if (deleteError) {
      console.log('⚠️  Error al limpiar tabla:', deleteError.message);
    }
    
    // 4. Migrar productos en lotes
    console.log('🚀 Migrando productos a Supabase...');
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < productos.length; i += batchSize) {
      const batch = productos.slice(i, i + batchSize);
      
      // Preparar datos para Supabase
      const productosParaInsertar = batch.map(p => ({
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion || '',
        precio: p.precio || 0,
        categoria: p.categoria || '',
        imagen: p.imagen || '',
        stock: p.stock || 0,
        destacado: p.destacado || false,
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('productos')
        .insert(productosParaInsertar);
      
      if (error) {
        console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} migrado: ${batch.length} productos`);
      }
      
      // Pequeña pausa para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Migración completada!');
    console.log(`✅ Productos migrados exitosamente: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Errores: ${errorCount}`);
    }
    
    // 5. Verificar migración
    console.log('🔍 Verificando migración...');
    const { data: verificarData, error: verificarError } = await supabase
      .from('productos')
      .select('count')
      .limit(1);
    
    if (verificarError) {
      console.log('❌ Error al verificar:', verificarError.message);
    } else {
      console.log(`📊 Total en Supabase: ${verificarData.length > 0 ? verificarData[0].count : 'N/A'}`);
    }
    
  } catch (error) {
    console.error('💥 Error durante la migración:', error);
  } finally {
    await neonPool.end();
  }
}

// Función para crear la tabla si no existe
async function crearTablaProductos() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) DEFAULT 0,
        categoria VARCHAR(100),
        imagen TEXT,
        stock INTEGER DEFAULT 0,
        destacado BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Crear índices para mejor rendimiento
      CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
      CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);
      CREATE INDEX IF NOT EXISTS idx_productos_precio ON productos(precio);
    `
  });
  
  if (error) {
    console.log('⚠️  Error al crear tabla:', error.message);
  } else {
    console.log('✅ Tabla productos creada/verificada en Supabase');
  }
}

// Ejecutar migración
if (import.meta.url === `file://${process.argv[1]}`) {
  migrarProductos();
}

export { migrarProductos, crearTablaProductos };
