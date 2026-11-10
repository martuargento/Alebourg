const { createHash } = require('node:crypto');
const { prisma } = require('../lib/prisma');

function obtenerInicio(range = '30d') {
  const match = String(range).match(/^(\d{1,4})(d|m|y)$/);
  const desde = new Date();
  if (!match) {
    desde.setDate(desde.getDate() - 30);
    return desde;
  }
  const cantidad = Math.min(Number(match[1]), 3650);
  if (match[2] === 'd') desde.setDate(desde.getDate() - cantidad);
  if (match[2] === 'm') desde.setMonth(desde.getMonth() - cantidad);
  if (match[2] === 'y') desde.setFullYear(desde.getFullYear() - cantidad);
  return desde;
}

function convertirFecha(timestamp) {
  const fecha = timestamp ? new Date(Number(timestamp)) : new Date();
  return BigInt(Number.isNaN(fecha.getTime()) ? Date.now() : fecha.getTime());
}

function periodo(fecha, granularidad) {
  const date = new Date(Number(fecha));
  if (granularidad === 'year') return String(date.getFullYear());
  if (granularidad === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  const inicio = new Date(date);
  if (granularidad === 'week') {
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  }
  inicio.setHours(0, 0, 0, 0);
  return inicio.toISOString().slice(0, 10);
}

function agrupar(registros, campo) {
  const conteo = new Map();
  for (const registro of registros) {
    const valor = String(registro[campo] || '') || '(direct)';
    conteo.set(valor, (conteo.get(valor) || 0) + 1);
  }
  return Array.from(conteo, ([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

async function registrarEvento(req, res) {
  const type = String(req.query.type || '');
  const ipHeader = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ip = Array.isArray(ipHeader) ? ipHeader[0] : String(ipHeader).split(',')[0];
  const ipHash = createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 32);
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 300);
  const ts = convertirFecha(req.body?.ts);

  if (type === 'track') {
    const path = String(req.body?.path || '/').slice(0, 500);
    const referer = String(req.headers.referer || '').slice(0, 300);
    const country = String(req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '').slice(0, 10);
    const isBot = /bot|crawl|spider|slurp|facebookexternalhit|wget|curl|monitor|pingdom/i.test(userAgent);
    await prisma.analyticsVisit.create({
      data: { ipHash, userAgent, referer, path, country, isBot, ts },
    });
    return res.json({ ok: true, stored: true });
  }

  if (type === 'event') {
    const eventType = String(req.body?.type || '').trim().slice(0, 50);
    if (!eventType) return res.status(400).json({ ok: false, error: 'missing type' });
    await prisma.analyticsEvent.create({
      data: {
        ipHash,
        userAgent,
        sessionId: String(req.body?.sessionId || '').slice(0, 80),
        eventType,
        payload: process.env.NODE_ENV === 'production'
          ? req.body?.payload ?? {}
          : JSON.stringify(req.body?.payload ?? {}),
        ts,
      },
    });
    return res.json({ ok: true, stored: true });
  }
  return res.status(404).json({ ok: false, error: 'Unknown type or method' });
}

async function obtenerMetricas(req, res) {
  const type = String(req.query.type || '');
  const now = new Date();
  const since = BigInt(obtenerInicio(req.query.range).getTime());
  const where = { ts: { gte: since, lte: BigInt(now.getTime()) } };
  const granularidad = String(req.query.granularity || 'day');

  if (type === 'stats') {
    const data = await prisma.analyticsVisit.findMany({
      where,
      select: { ipHash: true, ts: true, isBot: true },
      orderBy: { ts: 'asc' },
    });
    const periods = new Map();
    for (const visit of data) {
      const key = periodo(visit.ts, granularidad);
      const bucket = periods.get(key) || { total: 0, uniques: new Set() };
      bucket.total += 1;
      if (!visit.isBot) bucket.uniques.add(visit.ipHash);
      periods.set(key, bucket);
    }
    return res.json({
      ok: true,
      total: data.length,
      unique: new Set(data.filter((visit) => !visit.isBot).map((visit) => visit.ipHash)).size,
      series: Array.from(periods, ([key, value]) => ({
        period: key,
        total: value.total,
        unique: value.uniques.size,
      })).sort((a, b) => a.period.localeCompare(b.period)),
    });
  }

  if (type === 'event-stats') {
    const data = await prisma.analyticsEvent.findMany({
      where,
      select: { eventType: true, ts: true, payload: true },
      orderBy: { ts: 'asc' },
    });
    const periods = new Map();
    const productos = new Map();
    let totalAdd = 0;
    let totalView = 0;
    for (const event of data) {
      const key = periodo(event.ts, granularidad);
      const bucket = periods.get(key) || { add: 0, view: 0 };
      if (event.eventType === 'add_to_cart') {
        bucket.add += 1;
        totalAdd += 1;
        const payload = typeof event.payload === 'string'
          ? JSON.parse(event.payload || '{}')
          : event.payload;
        const productId = payload?.productId;
        if (productId) productos.set(String(productId), (productos.get(String(productId)) || 0) + 1);
      }
      if (event.eventType === 'view_cart') {
        bucket.view += 1;
        totalView += 1;
      }
      periods.set(key, bucket);
    }
    const topProducts = Array.from(productos, ([productId, count]) => ({ productId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const productIds = topProducts.map(({ productId }) => Number(productId)).filter(Number.isSafeInteger);
    const productData = productIds.length
      ? await prisma.producto.findMany({
        where: { id: { in: productIds } },
        select: { id: true, titulo: true },
      })
      : [];
    const titles = new Map(productData.map((product) => [String(product.id), product.titulo]));
    return res.json({
      ok: true,
      totals: {
        add_to_cart: totalAdd,
        view_cart: totalView,
        conversion: totalAdd ? totalView / totalAdd : 0,
      },
      series: Array.from(periods, ([key, value]) => ({
        period: key,
        add_to_cart: value.add,
        view_cart: value.view,
        conversion: value.add ? value.view / value.add : 0,
      })).sort((a, b) => a.period.localeCompare(b.period)),
      topProducts: topProducts.map((product) => ({
        ...product,
        title: titles.get(product.productId) || null,
      })),
    });
  }

  if (type === 'insights') {
    const data = await prisma.analyticsVisit.findMany({
      where,
      select: { path: true, referer: true, country: true },
    });
    return res.json({
      ok: true,
      topPaths: agrupar(data, 'path'),
      topReferers: agrupar(data, 'referer'),
      topCountries: agrupar(data, 'country'),
    });
  }
  return res.status(404).json({ ok: false, error: 'Unknown type or method' });
}

module.exports = { registrarEvento, obtenerMetricas };
