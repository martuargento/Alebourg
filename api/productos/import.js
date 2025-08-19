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
    // Deduplicar por id dentro del lote recibido (conservar última ocurrencia)
    const receivedCount = productos.length;
    const idToProduct = new Map();
    for (const item of productos) {
      if (item && typeof item.id !== 'undefined' && item.id !== null) {
        idToProduct.set(item.id, item);
      }
    }
    productos = Array.from(idToProduct.values());
    const uniqueCount = productos.length;

    if (importMode === 'replace') {
      const { error: delError } = await supabase.from('productos').delete().neq('id', -1);
      if (delError) throw delError;
    }

    // Upsert para evitar fallas por IDs duplicados
    const { error: upsertError } = await supabase
      .from('productos')
      .upsert(productos, { onConflict: 'id' });
    if (upsertError) throw upsertError;

    // Contar total real en tabla
    const { count, error: countError } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true });
    if (countError) throw countError;

    return res.json({
      ok: true,
      mode: importMode,
      received: receivedCount,
      uniqueInPayload: uniqueCount,
      inserted: uniqueCount,
      totalInTable: count
    });
  } catch (err) {
    console.error('Fallo importación:', err);
    return res.status(500).json({ error: 'Error al importar productos', detail: err.message });
  }
}
