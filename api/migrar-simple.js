import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

console.log('🚀 INICIANDO MIGRACIÓN SIMPLE...');

// Configuración de Supabase
const supabaseUrl = 'https://ihlhkpmzqhbedixiwdrb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0Mjk5MywiZXhwIjoyMDcxMTE4OTkzfQ.Blixh0ykJ9F7lNxgle6dFzNzzx3OF_f3mfg5paOTsx8';

console.log('📋 Configuración cargada');

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log('✅ Cliente de Supabase creado');

// Obtener la ruta del archivo JSON
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jsonPath = join(__dirname, '..', 'src', 'assets', 'productosalebourgactulizados.json');

console.log('📁 Ruta del archivo JSON:', jsonPath);

// Leer archivo JSON
console.log('📖 Leyendo archivo JSON...');
const jsonContent = readFileSync(jsonPath, 'utf8');
const productos = JSON.parse(jsonContent);
console.log(`📊 Encontrados ${productos.length} productos en el JSON`);

// Verificar conexión con Supabase
console.log('🔍 Verificando conexión con Supabase...');
const { error: testError } = await supabase
  .from('productos')
  .select('count')
  .limit(1);

if (testError) {
  console.error('❌ Error de conexión:', testError.message);
  process.exit(1);
}

console.log('✅ Conexión exitosa con Supabase');

// Limpiar tabla existente
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

// Migrar productos en lotes
console.log('🚀 Migrando productos a Supabase...');
const batchSize = 50;
let successCount = 0;
let errorCount = 0;

for (let i = 0; i < productos.length; i += batchSize) {
  const batch = productos.slice(i, i + batchSize);
  
  // Preparar datos para Supabase - SOLO los campos de la imagen
  const productosParaInsertar = batch.map(p => ({
    id: p.id || undefined,
    titulo: p.titulo || 'Sin título',
    imagen: p.imagen || '',
    precio: (p.precio || 0).toString(),
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
  
  // Pausa entre lotes
  await new Promise(resolve => setTimeout(resolve, 200));
}

console.log('\n🎉 MIGRACIÓN COMPLETADA!');
console.log(`✅ Productos migrados exitosamente: ${successCount}`);
if (errorCount > 0) {
  console.log(`❌ Errores: ${errorCount}`);
}

// Verificar migración final
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

console.log('\n✨ ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
