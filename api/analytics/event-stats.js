import { getSupabaseClient } from '../_supabaseClient.js';

function startOf(unit, date = new Date()) {
  const d = new Date(date);
  if (unit === 'day') d.setHours(0, 0, 0, 0);
  if (unit === 'week') { const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); d.setHours(0,0,0,0); }
  if (unit === 'month') { d.setDate(1); d.setHours(0,0,0,0); }
  if (unit === 'year') { d.setMonth(0,1); d.setHours(0,0,0,0); }
  return d;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const supabase = getSupabaseClient();
    const granularity = (req.query.granularity || 'day').toString();
    const range = (req.query.range || '30d').toString();

    const now = new Date();
    let since = new Date(now);
    if (range.endsWith('d')) since.setDate(now.getDate() - parseInt(range));
    else if (range.endsWith('m')) since.setMonth(now.getMonth() - parseInt(range));
    else if (range.endsWith('y')) since.setFullYear(now.getFullYear() - parseInt(range));
    else since.setDate(now.getDate() - 30);

    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_type, ts, payload')
      .gte('ts', +since)
      .lte('ts', +now);

    if (error) return res.status(200).json({ ok: false, error: error.message });

    const keyFn = (t) => {
      const d = new Date(t);
      if (granularity === 'day') return d.toISOString().slice(0, 10);
      if (granularity === 'week') return startOf('week', d).toISOString().slice(0,10);
      if (granularity === 'month') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (granularity === 'year') return `${d.getFullYear()}`;
      return d.toISOString().slice(0, 10);
    };

    const perPeriod = new Map();
    let totalAdd = 0, totalView = 0;
    const productAddCount = new Map();

    for (const r of data) {
      const k = keyFn(r.ts);
      if (!perPeriod.has(k)) perPeriod.set(k, { add: 0, view: 0 });
      const o = perPeriod.get(k);
      if (r.event_type === 'add_to_cart') { o.add++; totalAdd++; try { const pid = r.payload?.productId; if (pid) productAddCount.set(pid, (productAddCount.get(pid)||0)+1); } catch(_){} }
      if (r.event_type === 'view_cart') { o.view++; totalView++; }
    }

    const series = Array.from(perPeriod.entries())
      .map(([period, v]) => ({ period, add_to_cart: v.add, view_cart: v.view, conversion: v.add ? (v.view / v.add) : 0 }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const topProducts = Array.from(productAddCount.entries())
      .map(([productId, count]) => ({ productId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Enriquecer con títulos de productos
    if (topProducts.length > 0) {
      const ids = topProducts.map(p => p.productId);
      const { data: prodData } = await supabase
        .from('productos')
        .select('id,titulo')
        .in('id', ids);
      const idToTitle = new Map((prodData || []).map(p => [String(p.id), p.titulo]));
      topProducts.forEach(p => { p.title = idToTitle.get(String(p.productId)) || null; });
    }

    return res.status(200).json({ ok: true, totals: { add_to_cart: totalAdd, view_cart: totalView, conversion: totalAdd ? totalView/totalAdd : 0 }, series, topProducts });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}


