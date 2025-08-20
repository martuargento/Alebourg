import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuración de Supabase
const supabaseUrl = 'https://ihlhkpmzqhbedixiwdrb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0Mjk5MywiZXhwIjoyMDcxMTE4OTkzfQ.Blixh0ykJ9F7lNxgle6dFzNzzx3OF_f3mfg5paOTsx8';

// Crear cliente de Supabase con service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Obtener la ruta del archivo JSON
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jsonPath = join(__dirname, '..', 'src', 'assets', 'productosalebourgactulizados.json');

async function migrarDesdeJSON() {
  try {
    console.log('🔄 Iniciando migración desde JSON a Supabase...');
    
    // 1. Leer archivo JSON
    console.log('📖 Leyendo archivo JSON...');
    let productos;
    try {
      const jsonContent = readFileSync(jsonPath, 'utf8');
      productos = JSON.parse(jsonContent);
      console.log(`📊 Encontrados ${productos.length} productos en el JSON`);
    } catch (error) {
      console.error('❌ Error al leer el archivo JSON:', error.message);
      return;
    }
    
    if (!Array.isArray(productos) || productos.length === 0) {
      console.log('❌ No hay productos válidos para migrar');
      return;
    }
    
    // 2. Verificar conexión con Supabase
    console.log('🔍 Verificando conexión con Supabase...');
    const { error: testError } = await supabase
      .from('productos')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error de conexión con Supabase:', testError.message);
      console.log('📋 Asegúrate de que la tabla productos existe en Supabase');
      return;
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    
    // 3. Limpiar tabla existente (opcional)
    console.log('🧹 Limpiando tabla existente...');
    const { error: deleteError } = await supabase
      .from('productos')
      .delete()
      .neq('id', 0);
    
    if (deleteError) {
      console.log('⚠️  Error al limpiar tabla:', deleteError.message);
    } else {
      console.log('✅ Tabla limpiada');
    }
    
    // 4. Migrar productos en lotes
    console.log('🚀 Migrando productos a Supabase...');
    const batchSize = 50; // Lotes más pequeños para evitar timeouts
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < productos.length; i += batchSize) {
      const batch = productos.slice(i, i + batchSize);
      
      // Preparar datos para Supabase - SOLO los campos de la imagen
      const productosParaInsertar = batch.map(p => ({
        id: p.id || undefined, // Dejar que Supabase genere el ID si no existe
        titulo: p.titulo || 'Sin título',
        imagen: p.imagen || '',
        precio: (p.precio || 0).toString(), // Convertir a texto como en la imagen
        categoria: (p.categoria || '').toString().toLowerCase().trim()
      }));
      
      try {
        const { data, error } = await supabase
          .from('productos')
          .insert(productosParaInsertar)
          .select();
        
        if (error) {
          console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
          errorCount += batch.length;
        } else {
          successCount += data.length;
          console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} migrado: ${data.length} productos`);
        }
      } catch (error) {
        console.error(`❌ Error en lote ${Math.floor(i/batchSize) + 1}:`, error.message);
        errorCount += batch.length;
      }
      
      // Pausa entre lotes para no sobrecargar la API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n🎉 Migración completada!');
    console.log(`✅ Productos migrados exitosamente: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Errores: ${errorCount}`);
    }
    
    // 5. Verificar migración final
    console.log('🔍 Verificando migración final...');
    const { data: verificarData, error: verificarError } = await supabase
      .from('productos')
      .select('*')
      .limit(5);
    
    if (verificarError) {
      console.log('❌ Error al verificar:', verificarError.message);
    } else {
      console.log(`📊 Productos en Supabase: ${verificarData.length} (muestra de 5)`);
      if (verificarData.length > 0) {
        console.log('📋 Primer producto:', verificarData[0].titulo);
      }
    }
    
  } catch (error) {
    console.error('💥 Error durante la migración:', error);
  }
}

// Función para verificar la estructura de la tabla
async function verificarEstructuraTabla() {
  try {
    console.log('🔍 Verificando estructura de la tabla productos...');
    
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ La tabla productos no existe');
        console.log('📋 Crea la tabla desde el dashboard de Supabase con esta estructura SIMPLE:');
        console.log(`
          CREATE TABLE productos (
            id SERIAL PRIMARY KEY,
            titulo TEXT,
            imagen TEXT,
            precio TEXT,
            categoria TEXT
          );
        `);
        return false;
      } else {
        console.error('❌ Error al verificar tabla:', error.message);
        return false;
      }
    }
    
    console.log('✅ Tabla productos existe y es accesible');
    return true;
    
  } catch (error) {
    console.error('💥 Error al verificar tabla:', error);
    return false;
  }
}

// Ejecutar migración
async function main() {
  console.log('🚀 Iniciando migración desde JSON a Supabase...\n');
  
  const tablaOk = await verificarEstructuraTabla();
  if (!tablaOk) {
    console.log('❌ No se puede proceder sin la tabla productos');
    return;
  }
  
  await migrarDesdeJSON();
  
  console.log('\n✨ Migración completada!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { migrarDesdeJSON, verificarEstructuraTabla };
