import { getSupabaseAdminClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const forwarded = req.headers['x-forwarded-for'] || '';
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0] || req.socket?.remoteAddress || '0.0.0.0';
    const ua = req.headers['user-agent'] || '';
    const referer = req.headers.referer || '';
    const country = req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '';

    // Sencillo detector de bots
    const isBot = /bot|crawl|spider|slurp|facebookexternalhit|wget|curl|monitor|pingdom/i.test(ua);

    // Hash simple y no reversible del IP para privacidad
    const crypto = await import('crypto');
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);

    const { path = '/', ts = Date.now() } = req.body || {};

    // Inserción en tabla analytics_visits (crear en Supabase si no existe)
    const { error } = await supabase.from('analytics_visits').insert({
      ip_hash: ipHash,
      user_agent: ua?.slice(0, 300),
      referer: referer?.slice(0, 300),
      path,
      is_bot: isBot,
      country,
      ts
    });

    if (error) {
      console.error('[analytics] insert error', error);
      return res.status(200).json({ ok: false, stored: false });
    }

    return res.status(200).json({ ok: true, stored: true });
  } catch (e) {
    console.error('[analytics] unexpected', e);
    return res.status(200).json({ ok: false, stored: false });
  }
}


