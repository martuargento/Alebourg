import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://ihlhkpmzqhbedixiwdrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzE5NzQsImV4cCI6MjA0ODU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

// Crear el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para obtener el cliente de Supabase
export const getSupabaseClient = () => {
  return supabase;
};

// Función para probar la conexión
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('[Supabase] Error de conexión:', error);
      return false;
    }
    
    console.log('[Supabase] Conexión exitosa');
    return true;
  } catch (error) {
    console.error('[Supabase] Error de conexión:', error);
    return false;
  }
};

export default supabase;
