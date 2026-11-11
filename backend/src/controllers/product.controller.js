const { prisma } = require('../lib/prisma');

const CONFIG_KEY = 'productos-admin-config';
const PRODUCT_KEY_PREFIX = 'producto-admin:';

function errorValidacion(mensaje) {
  const error = new Error(mensaje);
  error.statusCode = 400;
  return error;
}

function parsearJson(valor, mensajeError) {
  try {
    return JSON.parse(valor);
  } catch {
    throw new Error(mensajeError);
  }
}

async function leerConfig() {
  const guardado = await prisma.appSetting.findUnique({ where: { key: CONFIG_KEY } });
  if (!guardado) {
    return { ordenPersonalizadoActivo: false, orden: [], masVendidos: [], ofertas: [] };
  }
  const config = parsearJson(guardado.value, 'La configuración de productos está dañada.');
  return {
    ordenPersonalizadoActivo: Boolean(config.ordenPersonalizadoActivo),
    orden: Array.isArray(config.orden) ? config.orden : [],
    masVendidos: Array.isArray(config.masVendidos) ? config.masVendidos : [],
    ofertas: Array.isArray(config.ofertas) ? config.ofertas : [],
  };
}

async function leerPersonalizaciones() {
  const filas = await prisma.appSetting.findMany({
    where: { key: { startsWith: PRODUCT_KEY_PREFIX } },
  });
  return filas.map((fila) => (
    parsearJson(fila.value, `La personalización ${fila.key} está dañada.`)
  ));
}

function serializarProducto(producto, personalizacion) {
  const imagen = String(
    Array.isArray(personalizacion?.imagenes)
      ? personalizacion.imagenes[0] || ''
      : personalizacion?.imagen ?? producto.imagen ?? '',
  );
  const imagenes = Array.isArray(personalizacion?.imagenes)
    ? personalizacion.imagenes
    : imagen ? [imagen] : [];
  const baseActual = {
    titulo: producto.titulo,
    precio: String(producto.precio),
    categoria: String(producto.categoria || ''),
    imagen: String(producto.imagen || ''),
  };
  const baseSnapshot = personalizacion?.baseSnapshot || baseActual;
  const pendienteRevision = Boolean(personalizacion) && !personalizacion.manual
    && Object.keys(baseActual).some((key) => baseActual[key] !== baseSnapshot[key]);

  return {
    ...producto,
    titulo: String(personalizacion?.titulo ?? producto.titulo),
    precio: String(personalizacion?.precioProveedor ?? producto.precio),
    precioFinal: personalizacion?.precioFinal ?? null,
    categoria: String(personalizacion?.categoria ?? producto.categoria ?? '').toLowerCase().trim(),
    imagen,
    imagenes,
    manual: Boolean(personalizacion?.manual),
    pendienteRevision,
    datosImportados: pendienteRevision ? baseActual : null,
  };
}

function ordenarProductos(productos, config) {
  if (config.ordenPersonalizadoActivo && config.orden.length) {
    const posiciones = new Map(config.orden.map((id, index) => [Number(id), index]));
    return [...productos].sort((a, b) => (
      (posiciones.get(a.id) ?? Number.MAX_SAFE_INTEGER)
      - (posiciones.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      || a.id - b.id
    ));
  }
  const personalizados = productos
    .filter((producto) => producto.orden > 0)
    .sort((a, b) => a.orden - b.orden || a.id - b.id);
  const sinOrden = productos
    .filter((producto) => producto.orden <= 0)
    .sort((a, b) => a.id - b.id);
  const ordenados = [];
  let posicion = 1;
  for (const producto of personalizados) {
    while (posicion < producto.orden && sinOrden.length > 0) {
      ordenados.push(sinOrden.shift());
      posicion += 1;
    }
    ordenados.push(producto);
    posicion = producto.orden + 1;
  }
  return [...ordenados, ...sinOrden];
}

async function cargarCatalogoAdministrado() {
  const [base, personalizaciones, config] = await Promise.all([
    prisma.producto.findMany({ orderBy: [{ orden: 'asc' }, { id: 'asc' }] }),
    leerPersonalizaciones(),
    leerConfig(),
  ]);
  const personalizacionesPorId = new Map(personalizaciones.map((item) => [Number(item.id), item]));
  const idsBase = new Set(base.map((item) => item.id));
  const productos = base.map((producto) => (
    serializarProducto(producto, personalizacionesPorId.get(producto.id))
  ));

  personalizaciones.forEach((personalizacion) => {
    if (personalizacion.manual || !idsBase.has(Number(personalizacion.id))) {
      const datosBase = personalizacion.baseSnapshot || {};
      productos.push(serializarProducto({
        id: Number(personalizacion.id),
        titulo: datosBase.titulo || personalizacion.titulo,
        imagen: datosBase.imagen || personalizacion.imagen || '',
        precio: datosBase.precio || personalizacion.precioProveedor || '0',
        categoria: datosBase.categoria || personalizacion.categoria || '',
        orden: 0,
      }, personalizacion));
    }
  });
  const masVendidos = new Set(config.masVendidos.map(Number));
  const ofertas = new Set(config.ofertas.map(Number));
  const catalogoOrdenado = ordenarProductos(productos, config).map((producto) => ({
    ...producto,
    masVendido: masVendidos.has(producto.id),
    enOferta: ofertas.has(producto.id),
  }));
  return { productos: catalogoOrdenado, personalizacionesPorId, config };
}

async function listaDeProductos(req, res) {
  const { productos } = await cargarCatalogoAdministrado();
  if (req.query.debug === '1' || req.query.debug === 'true') {
    return res.json({
      source: process.env.NODE_ENV === 'production' ? 'postgresql' : 'sqlite-local',
      count: productos.length,
      totalInDb: productos.length,
    });
  }
  return res.json(productos);
}

async function obtenerProducto(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id === 0) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }
  const { productos } = await cargarCatalogoAdministrado();
  const producto = productos.find((item) => item.id === id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
  return res.json(producto);
}

async function obtenerConfigProductos(req, res) {
  return res.json(await leerConfig());
}

function normalizarIds(ids, campo) {
  if (!Array.isArray(ids) || ids.some((id) => !Number.isSafeInteger(Number(id)) || Number(id) === 0)) {
    throw errorValidacion(`La lista ${campo} no es válida.`);
  }
  return [...new Set(ids.map(Number))];
}

async function guardarConfigProductos(req, res) {
  const body = req.body || {};
  const config = {
    ordenPersonalizadoActivo: Boolean(body.ordenPersonalizadoActivo),
    orden: normalizarIds(body.orden || [], 'de orden'),
    masVendidos: normalizarIds(body.masVendidos || [], 'de más vendidos'),
    ofertas: normalizarIds(body.ofertas || [], 'de ofertas'),
  };
  const value = JSON.stringify(config);
  await prisma.appSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value },
    update: { value },
  });
  return res.json(config);
}

function validarPrecio(valor, campo, opcional = false) {
  if (opcional && (valor === null || valor === '')) return null;
  if (valor === undefined || !Number.isFinite(Number(valor)) || Number(valor) < 0) {
    throw errorValidacion(`El campo ${campo} debe ser un precio válido.`);
  }
  return String(Number(valor));
}

function validarUrlImagenes(imagenes) {
  if (!Array.isArray(imagenes) || imagenes.length > 12) {
    throw errorValidacion('La galería admite hasta 12 imágenes.');
  }
  return imagenes.map((imagen) => {
    let url;
    try {
      url = new URL(String(imagen));
    } catch {
      throw errorValidacion('Cada imagen debe tener una URL HTTP o HTTPS.');
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw errorValidacion('Cada imagen debe tener una URL HTTP o HTTPS.');
    }
    return url.toString();
  });
}

async function guardarPersonalizacion(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id === 0) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }
  const { productos, personalizacionesPorId } = await cargarCatalogoAdministrado();
  const actual = personalizacionesPorId.get(id);
  const producto = productos.find((item) => item.id === id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
  const body = req.body || {};
  const siguiente = {
    ...(actual || {}),
    id,
    titulo: body.titulo === undefined ? actual?.titulo : String(body.titulo).trim(),
    categoria: body.categoria === undefined ? actual?.categoria : String(body.categoria).trim(),
    precioProveedor: body.precioProveedor === undefined
      ? actual?.precioProveedor
      : validarPrecio(body.precioProveedor, 'precio del proveedor'),
    precioFinal: body.precioFinal === undefined
      ? actual?.precioFinal ?? null
      : validarPrecio(body.precioFinal, 'precio final', true),
    imagen: body.imagen === undefined ? actual?.imagen : String(body.imagen),
    imagenes: body.imagenes === undefined
      ? actual?.imagenes || producto.imagenes
      : validarUrlImagenes(body.imagenes),
    manual: Boolean(actual?.manual),
    baseSnapshot: actual?.baseSnapshot || {
      titulo: producto.titulo,
      precio: String(producto.precio),
      categoria: producto.categoria,
      imagen: producto.imagen,
    },
  };
  if (body.titulo !== undefined && !siguiente.titulo) {
    return res.status(400).json({ error: 'El título no puede estar vacío.' });
  }
  if (body.imagen !== undefined) siguiente.imagen = siguiente.imagen || siguiente.imagenes[0] || '';
  else if (body.imagenes !== undefined) siguiente.imagen = siguiente.imagenes[0] || '';

  const value = JSON.stringify(siguiente);
  await prisma.appSetting.upsert({
    where: { key: `${PRODUCT_KEY_PREFIX}${id}` },
    create: { key: `${PRODUCT_KEY_PREFIX}${id}`, value },
    update: { value },
  });
  return res.json(serializarProducto({
    id,
    titulo: siguiente.baseSnapshot.titulo,
    precio: siguiente.baseSnapshot.precio,
    categoria: siguiente.baseSnapshot.categoria,
    imagen: siguiente.baseSnapshot.imagen,
    orden: producto.orden || 0,
  }, siguiente));
}

async function crearProductoManual(req, res) {
  const body = req.body || {};
  const titulo = String(body.titulo || '').trim();
  if (!titulo) return res.status(400).json({ error: 'El título es obligatorio.' });
  const precioProveedor = validarPrecio(body.precioProveedor ?? body.precio ?? '0', 'precio del proveedor');
  const precioFinal = validarPrecio(body.precioFinal, 'precio final');
  const imagenes = validarUrlImagenes(body.imagenes || []);
  const idsExistentes = (await leerPersonalizaciones())
    .map((item) => Number(item.id))
    .filter((id) => id < 0);
  const id = Math.min(0, ...idsExistentes) - 1;
  const manual = {
    id,
    titulo,
    categoria: String(body.categoria || '').trim(),
    precioProveedor,
    precioFinal,
    imagen: imagenes[0] || '',
    imagenes,
    manual: true,
    baseSnapshot: {
      titulo,
      precio: precioProveedor,
      categoria: String(body.categoria || '').trim(),
      imagen: imagenes[0] || '',
    },
  };
  const value = JSON.stringify(manual);
  await prisma.appSetting.create({ data: { key: `${PRODUCT_KEY_PREFIX}${id}`, value } });
  const producto = serializarProducto({
    ...manual,
    precio: precioProveedor,
    orden: 0,
  }, manual);
  return res.status(201).json(producto);
}

async function marcarProductoRevisado(req, res) {
  const id = Number(req.params.id);
  const actual = (await leerPersonalizaciones()).find((item) => Number(item.id) === id);
  if (!actual) return res.status(404).json({ error: 'El producto no tiene cambios para revisar.' });
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (producto) {
    actual.baseSnapshot = {
      titulo: producto.titulo,
      precio: String(producto.precio),
      categoria: String(producto.categoria || ''),
      imagen: String(producto.imagen || ''),
    };
  }
  const value = JSON.stringify(actual);
  await prisma.appSetting.update({
    where: { key: `${PRODUCT_KEY_PREFIX}${id}` },
    data: { value },
  });
  return res.json({ ok: true });
}

async function subirImagenProducto(req, res) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ error: 'Adjuntá un archivo de imagen.' });
  }
  const tipo = req.headers['content-type'] || '';
  const extensiones = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  if (!extensiones[tipo]) return res.status(415).json({ error: 'Formato no soportado. Usá JPG, PNG o WebP.' });
  const baseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'productos';
  if (!baseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Falta configurar la conexión privada a Supabase Storage en el backend.' });
  }
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id === 0) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }
  const nombre = `${id}/${Date.now()}-${require('node:crypto').randomUUID()}.${extensiones[tipo]}`;
  const url = new URL(`/storage/v1/object/${encodeURIComponent(bucket)}/${nombre}`, baseUrl);
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': tipo,
      'x-upsert': 'false',
    },
    body: req.body,
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    console.error('Falló la carga a Supabase Storage:', respuesta.status, detalle);
    return res.status(502).json({ error: 'No se pudo guardar la imagen en Supabase Storage.' });
  }
  return res.status(201).json({
    url: new URL(`/storage/v1/object/public/${encodeURIComponent(bucket)}/${nombre}`, baseUrl).toString(),
  });
}

async function obtenerDestacados(req, res) {
  const { productos, config } = await cargarCatalogoAdministrado();
  const porId = new Map(productos.map((producto) => [producto.id, producto]));
  return res.json({
    masVendidos: config.masVendidos.map((id) => porId.get(Number(id))).filter(Boolean),
    ofertas: config.ofertas.map((id) => porId.get(Number(id))).filter(Boolean),
  });
}

module.exports = {
  listaDeProductos,
  obtenerProducto,
  obtenerConfigProductos,
  guardarConfigProductos,
  guardarPersonalizacion,
  crearProductoManual,
  marcarProductoRevisado,
  subirImagenProducto,
  obtenerDestacados,
};
