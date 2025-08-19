import { getSupabaseServerClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ADMIN-TOKEN, X-IMPORT-MODE');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase no configurado en el servidor' });
  }

  // Parseo robusto del body
  let productos = req.body;
  if (typeof productos === 'string') {
    try {
      productos = JSON.parse(productos);
    } catch (e) {
      return res.status(400).json({ error: 'JSON inválido en el cuerpo' });
    }
  }

  if (!Array.isArray(productos)) {
    return res.status(400).json({ error: 'Se esperaba un array JSON de productos' });
  }

  const importMode = (req.headers['x-import-mode'] || 'replace').toString().toLowerCase();

  try {
    if (importMode === 'replace') {
      const { error: delError } = await supabase.from('productos').delete().neq('id', -1);
      if (delError) throw delError;
    }

    // Inserción del chunk recibido
    const { error: insError } = await supabase.from('productos').insert(productos);
    if (insError) throw insError;

    return res.json({ ok: true, inserted: productos.length, mode: importMode });
  } catch (err) {
    console.error('Fallo importación:', err);
    return res.status(500).json({ error: 'Error al importar productos', detail: err.message });
  }
}
