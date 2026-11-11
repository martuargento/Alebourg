const { prisma } = require('../lib/prisma');

const CONFIG_KEY = 'productos-admin-config';

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

async function leerConfigGeneral() {
  const guardado = await prisma.appSetting.findUnique({ where: { key: CONFIG_KEY } });
  if (!guardado) {
    return { ordenPersonalizadoActivo: false };
  }
  const config = parsearJson(guardado.value, 'La configuración de productos está dañada.');
  return { ordenPersonalizadoActivo: Boolean(config.ordenPersonalizadoActivo) };
}

function configurarListas(configuracion, productosAdmin) {
  const porOrden = (campo) => productosAdmin
    .filter((producto) => producto[campo] !== null && producto[campo] !== undefined)
    .sort((a, b) => a[campo] - b[campo] || a.id - b.id)
    .map((producto) => producto.id);
  return {
    ...configuracion,
    orden: porOrden('ordenPersonalizado'),
    masVendidos: productosAdmin
      .filter((producto) => producto.masVendido)
      .sort((a, b) => (
        (a.ordenMasVendidos ?? Number.MAX_SAFE_INTEGER)
        - (b.ordenMasVendidos ?? Number.MAX_SAFE_INTEGER)
        || a.id - b.id
      ))
      .map((producto) => producto.id),
    ofertas: productosAdmin
      .filter((producto) => producto.enOferta)
      .sort((a, b) => (
        (a.ordenOfertas ?? Number.MAX_SAFE_INTEGER)
        - (b.ordenOfertas ?? Number.MAX_SAFE_INTEGER)
        || a.id - b.id
      ))
      .map((producto) => producto.id),
  };
}

function serializarProducto(producto, personalizacion) {
  const fotosPersonalizadas = personalizacion?.imagenes
    ?.slice()
    .sort((a, b) => a.orden - b.orden)
    .map((foto) => String(foto.url)) || [];
  const usarGaleriaPersonalizada = Boolean(personalizacion?.galeriaPersonalizada);
  const imagenes = usarGaleriaPersonalizada
    ? fotosPersonalizadas
    : personalizacion?.imagen != null
      ? [String(personalizacion.imagen)].filter(Boolean)
      : producto.imagen ? [String(producto.imagen)] : [];
  const imagen = usarGaleriaPersonalizada
    ? imagenes[0] || ''
    : String(personalizacion?.imagen ?? producto.imagen ?? '');
  const baseActual = {
    titulo: producto.titulo,
    precio: String(producto.precio),
    categoria: String(producto.categoria || ''),
    imagen: String(producto.imagen || ''),
  };
  const tieneSnapshot = Boolean(personalizacion) && [
    personalizacion.baseTitulo,
    personalizacion.basePrecio,
    personalizacion.baseCategoria,
    personalizacion.baseImagen,
  ].some((valor) => valor !== null);
  const baseSnapshot = tieneSnapshot ? {
    titulo: personalizacion.baseTitulo ?? '',
    precio: personalizacion.basePrecio ?? '',
    categoria: personalizacion.baseCategoria ?? '',
    imagen: personalizacion.baseImagen ?? '',
  } : baseActual;
  const pendienteRevision = Boolean(personalizacion) && !personalizacion.manual
    && Object.keys(baseActual).some((key) => baseActual[key] !== baseSnapshot[key]);

  return {
    ...producto,
    titulo: String(personalizacion?.titulo ?? producto.titulo),
    precio: String(personalizacion?.precioProveedor ?? producto.precio ?? '0'),
    precioFinal: personalizacion?.precioFinal ?? null,
    categoria: String(personalizacion?.categoria ?? producto.categoria ?? '').toLowerCase().trim(),
    imagen,
    imagenes,
    manual: Boolean(personalizacion?.manual),
    pendienteRevision,
    datosImportados: pendienteRevision ? baseActual : null,
    productoEliminadoImportacion: Boolean(personalizacion && !personalizacion.manual && producto.eliminadoImportacion),
    masVendido: Boolean(personalizacion?.masVendido),
    enOferta: Boolean(personalizacion?.enOferta),
  };
}

function ordenarProductos(productos, config) {
  if (config.orden.length) {
    const posiciones = new Map(config.orden.map((id, index) => [Number(id), index]));
    return [...productos].sort((a, b) => (
      (posiciones.get(a.id) ?? Number.MAX_SAFE_INTEGER)
      - (posiciones.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      || a.id - b.id
    ));
  }
  const agregadosManualmente = productos
    .filter((producto) => producto.manual)
    .sort((a, b) => a.id - b.id);
  const productosImportados = productos.filter((producto) => !producto.manual);
  const personalizados = productosImportados
    .filter((producto) => producto.orden > 0)
    .sort((a, b) => a.orden - b.orden || a.id - b.id);
  const sinOrden = productosImportados
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
  return [...ordenados, ...sinOrden, ...agregadosManualmente];
}

async function cargarCatalogoAdministrado() {
  const [base, productosAdmin, configuracion] = await Promise.all([
    prisma.producto.findMany({ orderBy: [{ orden: 'asc' }, { id: 'asc' }] }),
    prisma.productoAdmin.findMany({
      include: { imagenes: { orderBy: { orden: 'asc' } } },
    }),
    leerConfigGeneral(),
  ]);
  const personalizacionesPorId = new Map(productosAdmin.map((item) => [item.id, item]));
  const idsBase = new Set(base.map((item) => item.id));
  const productos = base.map((producto) => (
    serializarProducto(producto, personalizacionesPorId.get(producto.id))
  ));

  productosAdmin.forEach((personalizacion) => {
    const tieneDatosPersonalizados = personalizacion.titulo !== null
      || personalizacion.categoria !== null
      || personalizacion.precioProveedor !== null
      || personalizacion.baseTitulo !== null;
    if (personalizacion.manual || (!idsBase.has(personalizacion.id) && tieneDatosPersonalizados)) {
      const datosBase = {
        titulo: personalizacion.baseTitulo,
        precio: personalizacion.basePrecio,
        categoria: personalizacion.baseCategoria,
        imagen: personalizacion.baseImagen,
      };
      const eliminadoImportacion = !personalizacion.manual && !idsBase.has(personalizacion.id);
      productos.push(serializarProducto({
        id: personalizacion.id,
        titulo: datosBase.titulo || personalizacion.titulo || 'Producto',
        imagen: datosBase.imagen || personalizacion.imagen || '',
        precio: datosBase.precio || personalizacion.precioProveedor || '0',
        categoria: datosBase.categoria || personalizacion.categoria || '',
        orden: personalizacion.ordenPersonalizado ?? 0,
        eliminadoImportacion,
      }, personalizacion));
    }
  });
  const config = configurarListas(configuracion, productosAdmin);
  const catalogoOrdenado = ordenarProductos(productos, config);
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
  const [configuracion, productosAdmin] = await Promise.all([
    leerConfigGeneral(),
    prisma.productoAdmin.findMany({
      select: {
        id: true,
        ordenPersonalizado: true,
        masVendido: true,
        ordenMasVendidos: true,
        enOferta: true,
        ordenOfertas: true,
      },
    }),
  ]);
  return res.json(configurarListas(configuracion, productosAdmin));
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
  const ids = new Set([...config.orden, ...config.masVendidos, ...config.ofertas]);
  const existentes = await prisma.productoAdmin.findMany({
    select: {
      id: true,
      ordenPersonalizado: true,
      masVendido: true,
      ordenMasVendidos: true,
      enOferta: true,
      ordenOfertas: true,
    },
  });
  const existentesPorId = new Map(existentes.map((producto) => [producto.id, producto]));
  const ordenPorId = new Map(config.orden.map((id, indice) => [id, indice]));
  const masVendidosPorId = new Map(config.masVendidos.map((id, indice) => [id, indice]));
  const ofertasPorId = new Map(config.ofertas.map((id, indice) => [id, indice]));
  const idsAActualizar = new Set([...ids, ...existentes.map((producto) => producto.id)]);
  const escrituras = [];

  idsAActualizar.forEach((id) => {
    const datos = {
      ordenPersonalizado: ordenPorId.get(id) ?? null,
      masVendido: masVendidosPorId.has(id),
      ordenMasVendidos: masVendidosPorId.get(id) ?? null,
      enOferta: ofertasPorId.has(id),
      ordenOfertas: ofertasPorId.get(id) ?? null,
    };
    const actual = existentesPorId.get(id);
    if (actual && Object.keys(datos).every((campo) => actual[campo] === datos[campo])) return;
    escrituras.push(prisma.productoAdmin.upsert({
      where: { id },
      create: { id, ...datos },
      update: datos,
    }));
  });

  const value = JSON.stringify({ ordenPersonalizadoActivo: config.ordenPersonalizadoActivo });
  escrituras.push(prisma.appSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value },
    update: { value },
  }));
  await prisma.$transaction(escrituras);
  const productosAdmin = await prisma.productoAdmin.findMany({
    select: {
      id: true,
      ordenPersonalizado: true,
      masVendido: true,
      ordenMasVendidos: true,
      enOferta: true,
      ordenOfertas: true,
    },
  });
  return res.json(configurarListas(config, productosAdmin));
}

function validarPrecio(valor, campo, opcional = false) {
  if (opcional && (valor === null || valor === '')) return null;
  const texto = String(valor ?? '').trim();
  const formatoValido = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(texto);
  const normalizado = texto.replace(/,/g, '');
  if (!formatoValido || !Number.isFinite(Number(normalizado)) || Number(normalizado) < 0) {
    throw errorValidacion(`El campo ${campo} debe ser un precio válido.`);
  }
  return texto;
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
  const titulo = body.titulo === undefined
    ? actual?.titulo ?? null
    : String(body.titulo).trim();
  if (body.titulo !== undefined && !titulo) {
    return res.status(400).json({ error: 'El título no puede estar vacío.' });
  }
  const imagenes = body.imagenes === undefined
    ? actual?.galeriaPersonalizada
      ? actual.imagenes.map((foto) => foto.url)
      : producto.imagenes
    : validarUrlImagenes(body.imagenes);
  let imagen = actual?.imagen ?? null;
  if (body.imagenes !== undefined) imagen = imagenes[0] || '';
  else if (body.imagen !== undefined) {
    imagen = body.imagen ? validarUrlImagenes([body.imagen])[0] : '';
  }
  const actualizarGaleria = body.imagenes !== undefined;
  const categoria = body.categoria === undefined
    ? actual?.categoria ?? null
    : String(body.categoria).trim();
  const datos = {
    manual: Boolean(actual?.manual),
    titulo,
    categoria,
    precioProveedor: body.precioProveedor === undefined
      ? actual?.precioProveedor ?? null
      : validarPrecio(body.precioProveedor, 'precio del proveedor', true),
    precioFinal: body.precioFinal === undefined
      ? actual?.precioFinal ?? null
      : validarPrecio(body.precioFinal, 'precio final', true),
    imagen,
    galeriaPersonalizada: actualizarGaleria
      ? true
      : body.imagen !== undefined ? false : Boolean(actual?.galeriaPersonalizada),
    baseTitulo: actual?.baseTitulo ?? producto.datosImportados?.titulo ?? producto.titulo,
    basePrecio: actual?.basePrecio ?? producto.datosImportados?.precio ?? producto.precio,
    baseCategoria: actual?.baseCategoria ?? producto.datosImportados?.categoria ?? producto.categoria,
    baseImagen: actual?.baseImagen ?? producto.datosImportados?.imagen ?? producto.imagen,
  };
  await prisma.$transaction(async (tx) => {
    await tx.productoAdmin.upsert({
      where: { id },
      create: { id, ...datos },
      update: datos,
    });
    if (actualizarGaleria) {
      await tx.productoAdminImagen.deleteMany({ where: { productoId: id } });
      if (imagenes.length) {
        await tx.productoAdminImagen.createMany({
          data: imagenes.map((url, orden) => ({ productoId: id, url, orden })),
        });
      }
    }
  });
  const guardado = await prisma.productoAdmin.findUnique({
    where: { id },
    include: { imagenes: { orderBy: { orden: 'asc' } } },
  });
  const baseActual = await prisma.producto.findUnique({ where: { id } });
  return res.json(serializarProducto(baseActual || {
    id,
    titulo: datos.baseTitulo || datos.titulo,
    precio: datos.basePrecio || datos.precioProveedor || '0',
    categoria: datos.baseCategoria || datos.categoria || '',
    imagen: datos.baseImagen || '',
    orden: producto.orden || 0,
    eliminadoImportacion: Boolean(producto.productoEliminadoImportacion),
  }, guardado));
}

async function crearProductoManual(req, res) {
  const body = req.body || {};
  const titulo = String(body.titulo || '').trim();
  if (!titulo) return res.status(400).json({ error: 'El título es obligatorio.' });
  const precioProveedor = validarPrecio(body.precioProveedor ?? body.precio ?? '0', 'precio del proveedor');
  const precioFinal = validarPrecio(body.precioFinal, 'precio final');
  const imagenes = validarUrlImagenes(body.imagenes || []);
  const negativos = await prisma.productoAdmin.findMany({
    where: { id: { lt: 0 } },
    select: { id: true },
    orderBy: { id: 'asc' },
    take: 1,
  });
  const id = (negativos[0]?.id ?? 0) - 1;
  const categoria = String(body.categoria || '').trim();
  const imagen = imagenes[0] || '';
  const manual = await prisma.productoAdmin.create({
    data: {
      id,
      manual: true,
      titulo,
      categoria,
      precioProveedor,
      precioFinal,
      imagen,
      galeriaPersonalizada: true,
      baseTitulo: titulo,
      basePrecio: precioProveedor,
      baseCategoria: categoria,
      baseImagen: imagen,
      imagenes: {
        create: imagenes.map((url, orden) => ({ url, orden })),
      },
    },
    include: { imagenes: { orderBy: { orden: 'asc' } } },
  });
  const producto = serializarProducto({
    id: manual.id,
    titulo: manual.titulo,
    categoria: manual.categoria,
    imagen: manual.imagen,
    precio: precioProveedor,
    orden: 0,
  }, manual);
  return res.status(201).json(producto);
}

async function eliminarProducto(req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id === 0) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }
  const [producto, personalizacion] = await Promise.all([
    prisma.producto.findUnique({ where: { id }, select: { id: true } }),
    prisma.productoAdmin.findUnique({ where: { id }, select: { id: true } }),
  ]);
  if (!producto && !personalizacion) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  await prisma.$transaction(async (tx) => {
    await tx.productoAdminImagen.deleteMany({ where: { productoId: id } });
    await tx.productoAdmin.deleteMany({ where: { id } });
    await tx.producto.deleteMany({ where: { id } });
  });
  return res.json({ ok: true, eliminado: true });
}

async function marcarProductoRevisado(req, res) {
  const id = Number(req.params.id);
  const actual = await prisma.productoAdmin.findUnique({ where: { id } });
  if (!actual) return res.status(404).json({ error: 'El producto no tiene cambios para revisar.' });
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) return res.status(404).json({ error: 'El producto ya no está en el catálogo importado.' });
  await prisma.productoAdmin.update({
    where: { id },
    data: {
      baseTitulo: producto.titulo,
      basePrecio: String(producto.precio),
      baseCategoria: String(producto.categoria || ''),
      baseImagen: String(producto.imagen || ''),
    },
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
  eliminarProducto,
  marcarProductoRevisado,
  subirImagenProducto,
  obtenerDestacados,
};
