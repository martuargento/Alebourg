import { getSupabaseAdminClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabase = getSupabaseAdminClient();
    const forwarded = req.headers['x-forwarded-for'] || '';
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0] || req.socket?.remoteAddress || '0.0.0.0';
    const ua = req.headers['user-agent'] || '';
    const crypto = await import('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);

    const { type, payload, ts, sessionId } = req.body || {};
    if (!type) return res.status(400).json({ ok: false, error: 'missing type' });

    const { error } = await supabase.from('analytics_events').insert({
      ts,
      ip_hash: ipHash,
      user_agent: ua?.slice(0, 300),
      session_id: (sessionId || '').toString().slice(0, 80),
      event_type: type.toString().slice(0, 50),
      payload
    });

    if (error) {
      console.error('[analytics:event] insert error', error);
      return res.status(200).json({ ok: false, stored: false });
    }
    return res.status(200).json({ ok: true, stored: true });
  } catch (e) {
    console.error('[analytics:event] unexpected', e);
    return res.status(200).json({ ok: false, stored: false });
  }
}


