import { getSupabaseClient } from '../_supabaseClient.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const supabase = getSupabaseClient();
    const range = (req.query.range || '30d').toString();
    const now = new Date();
    let since = new Date(now);
    if (range.endsWith('d')) since.setDate(now.getDate() - parseInt(range));
    else if (range.endsWith('m')) since.setMonth(now.getMonth() - parseInt(range));
    else if (range.endsWith('y')) since.setFullYear(now.getFullYear() - parseInt(range));
    else since.setDate(now.getDate() - 30);

    const { data, error } = await supabase
      .from('analytics_visits')
      .select('path, referer, country')
      .gte('ts', +since)
      .lte('ts', +now);

    if (error) return res.status(200).json({ ok: false, error: error.message });

    const countMap = (arr, key) => {
      const m = new Map();
      for (const x of arr) {
        const k = (x[key] || '').toString() || '(direct)';
        m.set(k, (m.get(k) || 0) + 1);
      }
      return Array.from(m.entries()).map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count).slice(0, 20);
    };

    return res.status(200).json({
      ok: true,
      topPaths: countMap(data, 'path'),
      topReferers: countMap(data, 'referer'),
      topCountries: countMap(data, 'country'),
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}


