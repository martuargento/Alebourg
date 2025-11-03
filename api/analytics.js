import { getSupabaseClient, getSupabaseAdminClient } from './_supabaseClient.js';

function startOf(unit, date = new Date()) {
  const d = new Date(date);
  if (unit === 'day') d.setHours(0, 0, 0, 0);
  if (unit === 'week') { const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); d.setHours(0,0,0,0); }
  if (unit === 'month') { d.setDate(1); d.setHours(0,0,0,0); }
  if (unit === 'year') { d.setMonth(0,1); d.setHours(0,0,0,0); }
  return d;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const type = (req.query.type || '').toString();

  try {
    if (type === 'track' && req.method === 'POST') {
      const supabase = getSupabaseAdminClient();
      const forwarded = req.headers['x-forwarded-for'] || '';
      const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0] || req.socket?.remoteAddress || '0.0.0.0';
      const ua = req.headers['user-agent'] || '';
      const referer = req.headers.referer || '';
      const country = req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '';
      const isBot = /bot|crawl|spider|slurp|facebookexternalhit|wget|curl|monitor|pingdom/i.test(ua);
      const crypto = await import('crypto');
      const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
      const { path = '/', ts = Date.now() } = req.body || {};
      const { error } = await supabase.from('analytics_visits').insert({ ip_hash: ipHash, user_agent: ua?.slice(0,300), referer: referer?.slice(0,300), path, is_bot: isBot, country, ts });
      if (error) return res.status(200).json({ ok: false, stored: false });
      return res.status(200).json({ ok: true, stored: true });
    }

    if (type === 'stats' && req.method === 'GET') {
      const supabase = getSupabaseClient();
      const granularity = (req.query.granularity || 'day').toString();
      const range = (req.query.range || '30d').toString();
      const now = new Date();
      let since = new Date(now);
      if (range.endsWith('d')) since.setDate(now.getDate() - parseInt(range));
      else if (range.endsWith('m')) since.setMonth(now.getMonth() - parseInt(range));
      else if (range.endsWith('y')) since.setFullYear(now.getFullYear() - parseInt(range));
      else since.setDate(now.getDate() - 30);
      const { data, error } = await supabase.from('analytics_visits').select('ip_hash, ts, path, is_bot').gte('ts', +since).lte('ts', +now);
      if (error) return res.status(200).json({ ok: false, error: error.message });
      const total = data.length;
      const unique = new Set(data.filter(r => !r.is_bot).map(r => r.ip_hash)).size;
      const buckets = new Map();
      const keyFn = (t) => { const d = new Date(t); if (granularity==='day') return d.toISOString().slice(0,10); if (granularity==='week') return startOf('week', d).toISOString().slice(0,10); if (granularity==='month') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; if (granularity==='year') return `${d.getFullYear()}`; return d.toISOString().slice(0,10); };
      for (const r of data) { const k = keyFn(r.ts); if (!buckets.has(k)) buckets.set(k, { total:0, uniques:new Set() }); const o=buckets.get(k); o.total++; if(!r.is_bot) o.uniques.add(r.ip_hash); }
      const series = Array.from(buckets.entries()).map(([k,v]) => ({ period:k, total:v.total, unique:v.uniques.size })).sort((a,b)=>a.period.localeCompare(b.period));
      return res.status(200).json({ ok:true, total, unique, series });
    }

    if (type === 'event' && req.method === 'POST') {
      const supabase = getSupabaseAdminClient();
      const forwarded = req.headers['x-forwarded-for'] || '';
      const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0] || req.socket?.remoteAddress || '0.0.0.0';
      const ua = req.headers['user-agent'] || '';
      const crypto = await import('crypto');
      const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
      const { type: evType, payload, ts, sessionId } = req.body || {};
      if (!evType) return res.status(400).json({ ok: false, error: 'missing type' });
      const { error } = await supabase.from('analytics_events').insert({ ts, ip_hash: ipHash, user_agent: ua?.slice(0,300), session_id: (sessionId||'').toString().slice(0,80), event_type: evType.toString().slice(0,50), payload });
      if (error) return res.status(200).json({ ok:false, stored:false });
      return res.status(200).json({ ok:true, stored:true });
    }

    if (type === 'event-stats' && req.method === 'GET') {
      const supabase = getSupabaseClient();
      const granularity = (req.query.granularity || 'day').toString();
      const range = (req.query.range || '30d').toString();
      const now = new Date(); let since = new Date(now);
      if (range.endsWith('d')) since.setDate(now.getDate() - parseInt(range));
      else if (range.endsWith('m')) since.setMonth(now.getMonth() - parseInt(range));
      else if (range.endsWith('y')) since.setFullYear(now.getFullYear() - parseInt(range));
      else since.setDate(now.getDate() - 30);
      const { data, error } = await supabase.from('analytics_events').select('event_type, ts, payload').gte('ts', +since).lte('ts', +now);
      if (error) return res.status(200).json({ ok:false, error: error.message });
      const keyFn = (t)=>{ const d=new Date(t); if (granularity==='day') return d.toISOString().slice(0,10); if (granularity==='week') return startOf('week', d).toISOString().slice(0,10); if (granularity==='month') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; if (granularity==='year') return `${d.getFullYear()}`; return d.toISOString().slice(0,10); };
      const perPeriod=new Map(); let totalAdd=0,totalView=0; const productAddCount=new Map();
      for (const r of data){ const k=keyFn(r.ts); if(!perPeriod.has(k)) perPeriod.set(k,{add:0,view:0}); const o=perPeriod.get(k); if(r.event_type==='add_to_cart'){ o.add++; totalAdd++; try{ const pid=r.payload?.productId; if(pid) productAddCount.set(pid,(productAddCount.get(pid)||0)+1);}catch(_){} } if(r.event_type==='view_cart'){ o.view++; totalView++; } }
      const series=Array.from(perPeriod.entries()).map(([period,v])=>({period, add_to_cart:v.add, view_cart:v.view, conversion: v.add ? (v.view/v.add) : 0})).sort((a,b)=>a.period.localeCompare(b.period));
      const topProducts=Array.from(productAddCount.entries()).map(([productId,count])=>({productId, count})).sort((a,b)=>b.count-a.count).slice(0,10);
      if (topProducts.length>0){ const ids=topProducts.map(p=>p.productId); const { data: prodData } = await supabase.from('productos').select('id,titulo').in('id', ids); const idToTitle=new Map((prodData||[]).map(p=>[String(p.id), p.titulo])); topProducts.forEach(p=>{ p.title=idToTitle.get(String(p.productId))||null; }); }
      return res.status(200).json({ ok:true, totals:{ add_to_cart: totalAdd, view_cart: totalView, conversion: totalAdd ? totalView/totalAdd : 0 }, series, topProducts });
    }

    if (type === 'insights' && req.method === 'GET') {
      const supabase = getSupabaseClient();
      const range = (req.query.range || '30d').toString();
      const now = new Date(); let since = new Date(now);
      if (range.endsWith('d')) since.setDate(now.getDate() - parseInt(range));
      else if (range.endsWith('m')) since.setMonth(now.getMonth() - parseInt(range));
      else if (range.endsWith('y')) since.setFullYear(now.getFullYear() - parseInt(range));
      else since.setDate(now.getDate() - 30);
      const { data, error } = await supabase.from('analytics_visits').select('path, referer, country').gte('ts', +since).lte('ts', +now);
      if (error) return res.status(200).json({ ok:false, error: error.message });
      const countMap=(arr,key)=>{ const m=new Map(); for(const x of arr){ const k=(x[key]||'').toString()||'(direct)'; m.set(k,(m.get(k)||0)+1);} return Array.from(m.entries()).map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count).slice(0,20); };
      return res.status(200).json({ ok:true, topPaths: countMap(data,'path'), topReferers: countMap(data,'referer'), topCountries: countMap(data,'country') });
    }

    return res.status(404).json({ ok: false, error: 'Unknown type or method' });
  } catch (e) {
    console.error('[analytics] error', e);
    return res.status(200).json({ ok:false, error: e.message });
  }
}


