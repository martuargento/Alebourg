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

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || req.headers['x-admin-token'] !== adminToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase no configurado' });
  }

  try {
    const { error } = await supabase.from('productos').delete().neq('id', -1);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error al limpiar', detail: err.message });
  }
}
