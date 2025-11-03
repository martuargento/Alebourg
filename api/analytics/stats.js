import { getSupabaseClient } from '../_supabaseClient.js';

function startOf(unit, date = new Date()) {
  const d = new Date(date);
  if (unit === 'day') d.setHours(0, 0, 0, 0);
  if (unit === 'week') {
    const day = d.getDay();
    const diff = (day + 6) % 7; // lunes como inicio
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
  }
  if (unit === 'month') { d.setDate(1); d.setHours(0,0,0,0); }
  if (unit === 'year') { d.setMonth(0,1); d.setHours(0,0,0,0); }
  return d;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const supabase = getSupabaseClient();
    const granularity = (req.query.granularity || 'day').toString();
    const range = (req.query.range || '30d').toString();

    // Rango
    const now = new Date();
    let since = new Date(now);
    if (range.endsWith('d')) since.setDate(now.getDate() - parseInt(range));
    else if (range.endsWith('m')) since.setMonth(now.getMonth() - parseInt(range));
    else if (range.endsWith('y')) since.setFullYear(now.getFullYear() - parseInt(range));
    else since.setDate(now.getDate() - 30);

    const { data, error } = await supabase
      .from('analytics_visits')
      .select('ip_hash, ts, path, is_bot')
      .gte('ts', +since)
      .lte('ts', +now);

    if (error) {
      return res.status(200).json({ ok: false, error: error.message });
    }

    const total = data.length;
    const unique = new Set(data.filter(r => !r.is_bot).map(r => r.ip_hash)).size;

    const buckets = new Map();
    const keyFn = (t) => {
      const d = new Date(t);
      if (granularity === 'day') return d.toISOString().slice(0, 10);
      if (granularity === 'week') {
        const s = startOf('week', d); return s.toISOString().slice(0,10);
      }
      if (granularity === 'month') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (granularity === 'year') return `${d.getFullYear()}`;
      return d.toISOString().slice(0, 10);
    };

    for (const r of data) {
      const k = keyFn(r.ts);
      if (!buckets.has(k)) buckets.set(k, { total: 0, uniques: new Set() });
      const obj = buckets.get(k);
      obj.total += 1;
      if (!r.is_bot) obj.uniques.add(r.ip_hash);
    }

    const series = Array.from(buckets.entries())
      .map(([k, v]) => ({ period: k, total: v.total, unique: v.uniques.size }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return res.status(200).json({ ok: true, total, unique, series });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}


