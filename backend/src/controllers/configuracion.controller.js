const { prisma } = require('../lib/prisma');

const CLAVE_CONFIGURACION_CARRUSEL = 'carousel-config';
const SEGUNDOS_CARRUSEL_MINIMOS = 2;
const SEGUNDOS_CARRUSEL_MAXIMOS = 60;
const DURACION_TRANSICION_MINIMA_MS = 300;
const DURACION_TRANSICION_MAXIMA_MS = 15000;
const TIPOS_TRANSICION_CARRUSEL = ['fade', 'slide', 'zoom'];
const CONFIGURACION_CARRUSEL_PREDETERMINADA = {
  mode: 'synchronized',
  intervalSeconds: 6,
  productIntervals: {},
  transition: 'fade',
  transitionDurationMs: 1200,
};

function segundosCarruselValidos(valor) {
  return Number.isInteger(valor)
    && valor >= SEGUNDOS_CARRUSEL_MINIMOS
    && valor <= SEGUNDOS_CARRUSEL_MAXIMOS;
}

function duracionTransicionCarruselValida(valor) {
  return Number.isInteger(valor)
    && valor >= DURACION_TRANSICION_MINIMA_MS
    && valor <= DURACION_TRANSICION_MAXIMA_MS;
}

function validarConfiguracionCarrusel(configuracion) {
  if (
    !configuracion
    || !['synchronized', 'individual'].includes(configuracion.mode)
    || !segundosCarruselValidos(configuracion.intervalSeconds)
    || !TIPOS_TRANSICION_CARRUSEL.includes(configuracion.transition)
    || !duracionTransicionCarruselValida(configuracion.transitionDurationMs)
    || !configuracion.productIntervals
    || typeof configuracion.productIntervals !== 'object'
    || Array.isArray(configuracion.productIntervals)
  ) {
    throw new Error('La configuración de carrusel guardada no es válida.');
  }

  for (const [id, segundos] of Object.entries(configuracion.productIntervals)) {
    if (!/^[1-9]\d*$/.test(id) || !segundosCarruselValidos(segundos)) {
      throw new Error('La configuración de ritmo por producto no es válida.');
    }
  }

  return configuracion;
}

async function leerConfiguracionCarrusel() {
  const guardado = await prisma.appSetting.findUnique({
    where: { key: CLAVE_CONFIGURACION_CARRUSEL },
  });
  if (!guardado) {
    return {
      ...CONFIGURACION_CARRUSEL_PREDETERMINADA,
      productIntervals: {},
    };
  }
  const guardada = JSON.parse(guardado.value);
  if (!guardada || typeof guardada !== 'object' || Array.isArray(guardada)) {
    throw new Error('La configuración de carrusel guardada no es válida.');
  }
  return validarConfiguracionCarrusel({
    ...CONFIGURACION_CARRUSEL_PREDETERMINADA,
    ...guardada,
    productIntervals: Object.prototype.hasOwnProperty.call(guardada, 'productIntervals')
      ? guardada.productIntervals
      : {},
  });
}

async function persistirConfiguracionCarrusel(configuracion) {
  const value = JSON.stringify(configuracion);
  await prisma.appSetting.upsert({
    where: { key: CLAVE_CONFIGURACION_CARRUSEL },
    create: { key: CLAVE_CONFIGURACION_CARRUSEL, value },
    update: { value },
  });
  return configuracion;
}

async function obtenerConfiguracionPrecios(req, res) {
  const guardado = await prisma.appSetting.findUnique({ where: { key: 'precios-config' } });
  if (!guardado) {
    return res.status(404).json({ error: 'No hay configuración de precios guardada en la base de datos.' });
  }
  return res.json(JSON.parse(guardado.value));
}

async function guardarConfiguracionPrecios(req, res) {
  const rangos = req.body?.rangos;
  if (!Array.isArray(rangos) || rangos.length < 2) {
    return res.status(400).json({ error: 'Los rangos de precios no son válidos.' });
  }
  const esMontoValido = (valor) => (
    valor !== ''
    && valor !== null
    && valor !== undefined
    && Number.isFinite(Number(valor))
    && Number(valor) >= 0
  );
  const rangosValidos = rangos.every((rango, index) => (
    rango
    &&
    esMontoValido(rango.limite)
    && esMontoValido(rango.monto)
    && Boolean(rango.mayorIgual) === (index === rangos.length - 1)
    && (
      index === 0
      || Number(rango.limite) > Number(rangos[index - 1].limite)
      || (index === rangos.length - 1 && Number(rango.limite) === Number(rangos[index - 1].limite))
    )
  ));
  if (!rangosValidos) {
    return res.status(400).json({ error: 'Los límites deben crecer y el último rango debe ser mayor o igual.' });
  }

  const ajusteEspecial = req.body.ajusteEspecial;
  if (ajusteEspecial !== null && (
    !String(ajusteEspecial?.prefijoTitulo || '').trim()
    || !esMontoValido(ajusteEspecial.limite)
    || !esMontoValido(ajusteEspecial.monto)
  )) {
    return res.status(400).json({ error: 'El ajuste especial no es válido.' });
  }
  if (!esMontoValido(req.body.minimoAuriculares)) {
    return res.status(400).json({ error: 'El precio mínimo para auriculares no es válido.' });
  }
  const configuracion = {
    rangos: rangos.map((rango) => ({
      limite: Number(rango.limite),
      monto: Number(rango.monto),
      ...(rango.mayorIgual ? { mayorIgual: true } : {}),
    })),
    ajusteEspecial: ajusteEspecial ? {
      prefijoTitulo: String(ajusteEspecial.prefijoTitulo).trim().toLowerCase(),
      limite: Number(ajusteEspecial.limite),
      monto: Number(ajusteEspecial.monto),
    } : null,
    minimoAuriculares: Number(req.body.minimoAuriculares),
  };
  const value = JSON.stringify(configuracion);
  await prisma.appSetting.upsert({
    where: { key: 'precios-config' },
    create: { key: 'precios-config', value },
    update: { value },
  });
  return res.json(configuracion);
}

async function obtenerConfiguracionCarrusel(req, res) {
  return res.json(await leerConfiguracionCarrusel());
}

async function guardarConfiguracionCarrusel(req, res) {
  const body = req.body || {};
  const { mode, intervalSeconds } = body;
  if (!['synchronized', 'individual'].includes(mode)) {
    return res.status(400).json({ error: 'El modo de rotación no es válido.' });
  }
  if (!segundosCarruselValidos(intervalSeconds)) {
    return res.status(400).json({
      error: `El intervalo debe ser un número entero entre ${SEGUNDOS_CARRUSEL_MINIMOS} y ${SEGUNDOS_CARRUSEL_MAXIMOS} segundos.`,
    });
  }

  const actual = await leerConfiguracionCarrusel();
  const transition = body.transition === undefined ? actual.transition : body.transition;
  const transitionDurationMs = body.transitionDurationMs === undefined
    ? actual.transitionDurationMs
    : body.transitionDurationMs;
  if (!TIPOS_TRANSICION_CARRUSEL.includes(transition)) {
    return res.status(400).json({ error: 'El tipo de transición no es válido.' });
  }
  if (!duracionTransicionCarruselValida(transitionDurationMs)) {
    return res.status(400).json({
      error: `La duración debe ser un número entero entre ${DURACION_TRANSICION_MINIMA_MS} y ${DURACION_TRANSICION_MAXIMA_MS} milisegundos.`,
    });
  }
  const configuracion = {
    ...actual,
    mode,
    intervalSeconds,
    transition,
    transitionDurationMs,
  };
  return res.json(await persistirConfiguracionCarrusel(configuracion));
}

async function guardarRitmoCarruselProducto(req, res) {
  const id = String(req.params.id || '');
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return res.status(400).json({ error: 'El identificador del producto no es válido.' });
  }

  const intervalSeconds = req.body?.intervalSeconds;
  if (intervalSeconds !== null && !segundosCarruselValidos(intervalSeconds)) {
    return res.status(400).json({
      error: `El intervalo debe ser nulo o un número entero entre ${SEGUNDOS_CARRUSEL_MINIMOS} y ${SEGUNDOS_CARRUSEL_MAXIMOS} segundos.`,
    });
  }

  const configuracion = await leerConfiguracionCarrusel();
  const productIntervals = { ...configuracion.productIntervals };
  if (intervalSeconds === null) delete productIntervals[id];
  else productIntervals[id] = intervalSeconds;

  return res.json(await persistirConfiguracionCarrusel({
    ...configuracion,
    productIntervals,
  }));
}

module.exports = {
  obtenerConfiguracionPrecios,
  guardarConfiguracionPrecios,
  obtenerConfiguracionCarrusel,
  guardarConfiguracionCarrusel,
  guardarRitmoCarruselProducto,
};
