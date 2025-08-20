import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

console.log('🚀 Iniciando script de prueba...');

// Configuración de Supabase
const supabaseUrl = 'https://ihlhkpmzqhbedixiwdrb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0Mjk5MywiZXhwIjoyMDcxMTE4OTkzfQ.Blixh0ykJ9F7lNxgle6dFzNzzx3OF_f3mfg5paOTsx8';

console.log('📋 URL de Supabase:', supabaseUrl);
console.log('🔑 Service Key configurada:', supabaseServiceKey ? 'SÍ' : 'NO');

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);
console.log('✅ Cliente de Supabase creado');

// Obtener la ruta del archivo JSON
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jsonPath = join(__dirname, '..', 'src', 'assets', 'productosalebourgactulizados.json');

console.log('📁 Ruta del archivo JSON:', jsonPath);

// Verificar si el archivo existe
try {
    const stats = readFileSync(jsonPath, 'utf8');
    const productos = JSON.parse(stats);
    console.log('📊 Archivo JSON leído correctamente');
    console.log('📈 Total de productos encontrados:', productos.length);
    
    if (productos.length > 0) {
        console.log('📋 Primer producto:', productos[0].titulo);
        console.log('🏷️  Campos disponibles:', Object.keys(productos[0]));
    }
} catch (error) {
    console.error('❌ Error leyendo el archivo JSON:', error.message);
    process.exit(1);
}

// Probar conexión con Supabase
console.log('\n🔍 Probando conexión con Supabase...');
try {
    const { data, error } = await supabase
        .from('productos')
        .select('*')
        .limit(1);
    
    if (error) {
        console.error('❌ Error de conexión:', error.message);
        console.error('🔍 Código de error:', error.code);
    } else {
        console.log('✅ Conexión exitosa con Supabase');
        console.log('📊 Productos en la tabla:', data.length);
    }
} catch (error) {
    console.error('💥 Error inesperado:', error.message);
}

console.log('\n✨ Script de prueba completado');
