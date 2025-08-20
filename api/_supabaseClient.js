import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://ihlhkpmzqhbedixiwdrb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDI5OTMsImV4cCI6MjA3MTExODk5M30.kxcgi7ws-m_M7GzAiwSVyGUPRTZqpdjMnJYJ-2xLcfA';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGhrcG16cWhiZWRpeGl3ZHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTU0Mjk5MywiZXhwIjoyMDcxMTE4OTkzfQ.Blixh0ykJ9F7lNxgle6dFzNzzx3OF_f3mfg5paOTsx8';

// Crear el cliente de Supabase con anon key (para operaciones de lectura)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Crear el cliente de Supabase con service role (para operaciones de escritura)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Función para obtener el cliente de Supabase (anon)
export const getSupabaseClient = () => {
  return supabase;
};

// Función para obtener el cliente de Supabase (admin/service role)
export const getSupabaseAdminClient = () => {
  return supabaseAdmin;
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

// Función para obtener estadísticas de la base de datos
export const getSupabaseStats = async () => {
  try {
    const { count, error } = await supabase
      .from('productos')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('[Supabase] Error obteniendo estadísticas:', error);
      return null;
    }
    
    return {
      totalProductos: count || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[Supabase] Error obteniendo estadísticas:', error);
    return null;
  }
};

export default supabase;
