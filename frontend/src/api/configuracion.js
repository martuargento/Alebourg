import api from './client';

const MINIMO_SEGUNDOS_CARRUSEL = 2;
const MAXIMO_SEGUNDOS_CARRUSEL = 60;
const TIPOS_TRANSICION_CARRUSEL = ['fade', 'slide', 'zoom'];
const DURACION_TRANSICION_MINIMA_MS = 300;
const DURACION_TRANSICION_MAXIMA_MS = 2500;

function validarConfiguracionCarrusel(data) {
  const intervalos = data?.productIntervals;
  const intervalosValidos = intervalos
    && typeof intervalos === 'object'
    && !Array.isArray(intervalos)
    && Object.entries(intervalos).every(([id, segundos]) => (
      /^[1-9]\d*$/.test(id)
      && Number.isInteger(segundos)
      && segundos >= MINIMO_SEGUNDOS_CARRUSEL
      && segundos <= MAXIMO_SEGUNDOS_CARRUSEL
    ));
  if (
    !['synchronized', 'individual'].includes(data?.mode)
    || !Number.isInteger(data.intervalSeconds)
    || data.intervalSeconds < MINIMO_SEGUNDOS_CARRUSEL
    || data.intervalSeconds > MAXIMO_SEGUNDOS_CARRUSEL
    || !TIPOS_TRANSICION_CARRUSEL.includes(data.transition)
    || !Number.isInteger(data.transitionDurationMs)
    || data.transitionDurationMs < DURACION_TRANSICION_MINIMA_MS
    || data.transitionDurationMs > DURACION_TRANSICION_MAXIMA_MS
    || !intervalosValidos
  ) {
    throw new Error('La API devolvió una configuración de carrusel inválida.');
  }
  return data;
}

export async function obtenerConfiguracionPrecios() {
  const { data } = await api.get('/precios-config');
  const rangosValidos = Array.isArray(data?.rangos) && data.rangos.every((rango, index) => (
    rango
    && rango.limite !== ''
    && rango.monto !== ''
    && Number.isFinite(Number(rango.limite))
    && Number(rango.limite) >= 0
    && Number.isFinite(Number(rango.monto))
    && Number(rango.monto) >= 0
    && Boolean(rango.mayorIgual) === (index === data.rangos.length - 1)
    && (
      index === 0
      || Number(rango.limite) > Number(data.rangos[index - 1].limite)
      || (index === data.rangos.length - 1
        && Number(rango.limite) === Number(data.rangos[index - 1].limite))
    )
  ));
  const ajuste = data?.ajusteEspecial;
  const ajusteEspecialValido = ajuste === null || (
    Boolean(String(ajuste?.prefijoTitulo || '').trim())
    && Number.isFinite(Number(ajuste.limite))
    && Number(ajuste.limite) >= 0
    && Number.isFinite(Number(ajuste.monto))
    && Number(ajuste.monto) >= 0
  );
  if (
    !data
    || !rangosValidos
    || data.minimoAuriculares === ''
    || !Number.isFinite(Number(data.minimoAuriculares))
    || Number(data.minimoAuriculares) < 0
    || !ajusteEspecialValido
  ) {
    throw new Error('La base de datos devolvió una configuración de precios inválida.');
  }
  return data;
}

export async function guardarReglasPrecios(payload) {
  const { data } = await api.post('/precios-config', payload);
  return data;
}

export async function obtenerConfiguracionCarrusel() {
  const { data } = await api.get('/carousel-config');
  return validarConfiguracionCarrusel(data);
}

export async function guardarConfiguracionCarrusel(configuracion) {
  const { data } = await api.post('/carousel-config', configuracion);
  return validarConfiguracionCarrusel(data);
}

export async function guardarRitmoCarruselProducto(id, intervalSeconds) {
  const { data } = await api.put(`/carousel-config/products/${encodeURIComponent(id)}`, {
    intervalSeconds,
  });
  return validarConfiguracionCarrusel(data);
}
