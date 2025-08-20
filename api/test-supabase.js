import { getSupabaseClient, getSupabaseAdminClient, getSupabaseStats } from './_supabaseClient.js';

async function testSupabase() {
  console.log('🧪 Iniciando pruebas de Supabase...\n');
  
  try {
    // 1. Probar conexión básica
    console.log('1️⃣  Probando conexión básica...');
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error de conexión:', error.message);
      if (error.code === '42P01') {
        console.log('💡 La tabla productos no existe. Crea la tabla primero.');
        return;
      }
    } else {
      console.log('✅ Conexión exitosa');
      console.log(`📊 Productos encontrados: ${data.length}`);
    }
    
    // 2. Probar cliente admin
    console.log('\n2️⃣  Probando cliente admin...');
    const supabaseAdmin = getSupabaseAdminClient();
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('productos')
      .select('count')
      .limit(1);
    
    if (adminError) {
      console.log('❌ Error con cliente admin:', adminError.message);
    } else {
      console.log('✅ Cliente admin funcionando');
    }
    
    // 3. Probar estadísticas
    console.log('\n3️⃣  Probando estadísticas...');
    const stats = await getSupabaseStats();
    if (stats) {
      console.log('✅ Estadísticas obtenidas:', stats);
    } else {
      console.log('❌ No se pudieron obtener estadísticas');
    }
    
    // 4. Probar consultas básicas
    console.log('\n4️⃣  Probando consultas básicas...');
    
    // Contar total de productos
    const { count: totalCount, error: countError } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Error contando productos:', countError.message);
    } else {
      console.log(`📊 Total de productos: ${totalCount || 0}`);
    }
    
    // Obtener productos por categoría
    const { data: categorias, error: catError } = await supabase
      .from('productos')
      .select('categoria')
      .limit(10);
    
    if (catError) {
      console.log('❌ Error obteniendo categorías:', catError.message);
    } else {
      const categoriasUnicas = [...new Set(categorias.map(p => p.categoria).filter(Boolean))];
      console.log(`🏷️  Categorías encontradas: ${categoriasUnicas.length}`);
      console.log('   Ejemplos:', categoriasUnicas.slice(0, 5).join(', '));
    }
    
    // 5. Probar filtros
    console.log('\n5️⃣  Probando filtros...');
    
    // Productos destacados
    const { data: destacados, error: destError } = await supabase
      .from('productos')
      .select('titulo, precio, categoria')
      .eq('destacado', true)
      .limit(5);
    
    if (destError) {
      console.log('❌ Error obteniendo destacados:', destError.message);
    } else {
      console.log(`⭐ Productos destacados: ${destacados.length}`);
      if (destacados.length > 0) {
        console.log('   Ejemplo:', destacados[0].titulo);
      }
    }
    
    // Productos por rango de precio
    const { data: precioRango, error: precioError } = await supabase
      .from('productos')
      .select('titulo, precio')
      .gte('precio', 100)
      .lte('precio', 500)
      .limit(5);
    
    if (precioError) {
      console.log('❌ Error obteniendo por precio:', precioError.message);
    } else {
      console.log(`💰 Productos entre $100-$500: ${precioRango.length}`);
    }
    
    console.log('\n🎉 Pruebas completadas!');
    
    // Resumen final
    console.log('\n📋 Resumen:');
    console.log(`   Total productos: ${totalCount || 'N/A'}`);
    console.log(`   Categorías: ${categoriasUnicas?.length || 'N/A'}`);
    console.log(`   Destacados: ${destacados?.length || 'N/A'}`);
    console.log(`   Conexión: ✅`);
    
  } catch (error) {
    console.error('💥 Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas
if (import.meta.url === `file://${process.argv[1]}`) {
  testSupabase();
}

export { testSupabase };
