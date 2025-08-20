import pkg from 'pg';
const { Pool } = pkg;

// Configuración de la conexión a Neon
const connectionString = 'postgresql://neondb_owner:npg_PJWA0eZpbuy4@ep-small-art-aej20xc7-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Crear el pool de conexiones
const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Función para obtener el cliente de Neon
export const getNeonClient = () => {
  return pool;
};

// Función para probar la conexión
export const testNeonConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('[Neon] Conexión exitosa:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('[Neon] Error de conexión:', error);
    return false;
  }
};

// Función para cerrar el pool
export const closeNeonPool = async () => {
  await pool.end();
};

export default pool;
