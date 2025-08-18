import { getSupabaseServerClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ADMIN-TOKEN');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Autenticación básica mediante token
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase no configurado en el servidor' });
  }

  const productos = req.body;
  if (!Array.isArray(productos)) {
    return res.status(400).json({ error: 'Se esperaba un array JSON de productos' });
  }

  try {
    // Estrategia: reemplazo completo
    // 1) Borrar tabla
    const { error: delError } = await supabase.from('productos').delete().neq('id', -1);
    if (delError) throw delError;

    // 2) Insertar en batch
    // Nota: supabase limita a ~1,000 filas por insert. Dividimos si hace falta
    const chunkSize = 800;
    for (let i = 0; i < productos.length; i += chunkSize) {
      const chunk = productos.slice(i, i + chunkSize);
      const { error: insError } = await supabase.from('productos').insert(chunk);
      if (insError) throw insError;
    }

    return res.json({ ok: true, inserted: productos.length });
  } catch (err) {
    console.error('Fallo importación:', err);
    return res.status(500).json({ error: 'Error al importar productos', detail: err.message });
  }
}
