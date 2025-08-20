import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://ihlhkpmzqhbedixiwdrb.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0Mjk5MywiZXhwIjoyMDcxMTE4OTkzfQ.Blixh0ykJ9F7lNxgle6dFzNzzx3OF_f3mfg5paOTsx8';

// Crear cliente de Supabase con service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function crearTablaProductos() {
  try {
    console.log('🔧 Verificando tabla productos en Supabase...');
    
    // Crear la tabla usando SQL directo
    const { error } = await supabase
      .from('productos')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Tabla no existe, crearla manualmente desde el dashboard de Supabase
      console.log('❌ La tabla productos no existe en Supabase');
      console.log('📋 Por favor, crea la tabla manualmente desde el dashboard de Supabase con esta estructura SIMPLE:');
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
    }
    
    console.log('✅ La tabla productos ya existe en Supabase');
    return true;
    
  } catch (error) {
    console.error('💥 Error al verificar/crear tabla:', error);
    return false;
  }
}

// Función para insertar productos de ejemplo
async function insertarProductosEjemplo() {
  try {
    console.log('📝 Insertando productos de ejemplo...');
    
    const productosEjemplo = [
      {
        titulo: 'Producto de Prueba 1',
        imagen: 'https://via.placeholder.com/300x300',
        precio: '99.99',
        categoria: 'prueba'
      },
      {
        titulo: 'Producto de Prueba 2',
        imagen: 'https://via.placeholder.com/300x300',
        precio: '149.99',
        categoria: 'prueba'
      }
    ];
    
    const { data, error } = await supabase
      .from('productos')
      .insert(productosEjemplo)
      .select();
    
    if (error) {
      console.error('❌ Error al insertar productos:', error);
      return false;
    }
    
    console.log(`✅ ${data.length} productos de ejemplo insertados`);
    return true;
    
  } catch (error) {
    console.error('💥 Error al insertar productos:', error);
    return false;
  }
}

// Función para verificar la conexión
async function verificarConexion() {
  try {
    console.log('🔍 Verificando conexión con Supabase...');
    
    const { data, error } = await supabase
      .from('productos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
    
    console.log('✅ Conexión exitosa con Supabase');
    return true;
    
  } catch (error) {
    console.error('💥 Error de conexión:', error);
    return false;
  }
}

// Ejecutar funciones
async function main() {
  console.log('🚀 Iniciando configuración de Supabase...\n');
  
  const conexionOk = await verificarConexion();
  if (!conexionOk) {
    console.log('❌ No se pudo conectar con Supabase');
    return;
  }
  
  const tablaOk = await crearTablaProductos();
  if (tablaOk) {
    await insertarProductosEjemplo();
  }
  
  console.log('\n✨ Configuración completada!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { crearTablaProductos, insertarProductosEjemplo, verificarConexion };
