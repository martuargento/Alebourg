import api from './client'

const MINIMO_SEGUNDOS_CARRUSEL = 2
const MAXIMO_SEGUNDOS_CARRUSEL = 60

function validarConfiguracionCarrusel(data) {
  const intervalos = data?.productIntervals
  const intervalosValidos = intervalos
    && typeof intervalos === 'object'
    && !Array.isArray(intervalos)
    && Object.entries(intervalos).every(([id, segundos]) => (
      /^[1-9]\d*$/.test(id)
      && Number.isInteger(segundos)
      && segundos >= MINIMO_SEGUNDOS_CARRUSEL
      && segundos <= MAXIMO_SEGUNDOS_CARRUSEL
    ))
  if (
    !['synchronized', 'individual'].includes(data?.mode)
    || !Number.isInteger(data.intervalSeconds)
    || data.intervalSeconds < MINIMO_SEGUNDOS_CARRUSEL
    || data.intervalSeconds > MAXIMO_SEGUNDOS_CARRUSEL
    || !intervalosValidos
  ) {
    throw new Error('La API devolvió una configuración de carrusel inválida.')
  }
  return data
}

export async function obtenerConfiguracionPrecios() {
  const { data } = await api.get('/api/precios-config')
  const rangosValidos = Array.isArray(data?.rangos) && data.rangos.every((rango, index) => (
    rango
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
  ))

  if (
    !rangosValidos
    || !Number.isFinite(Number(data?.minimoAuriculares))
    || Number(data.minimoAuriculares) < 0
    || (
      data.ajusteEspecial != null
      && (
        !String(data.ajusteEspecial?.prefijoTitulo || '').trim()
        || !Number.isFinite(Number(data.ajusteEspecial?.limite))
        || !Number.isFinite(Number(data.ajusteEspecial?.monto))
      )
    )
  ) {
    throw new Error('La API devolvió una configuración de precios inválida.')
  }

  return data
}

export async function obtenerConfiguracionCarrusel() {
  const { data } = await api.get('/api/carousel-config')
  return validarConfiguracionCarrusel(data)
}

export async function guardarConfiguracionCarrusel(configuracion) {
  const { data } = await api.post('/api/carousel-config', configuracion)
  return validarConfiguracionCarrusel(data)
}

export async function guardarRitmoCarruselProducto(id, intervalSeconds) {
  const { data } = await api.put(`/api/carousel-config/products/${encodeURIComponent(id)}`, {
    intervalSeconds,
  })
  return validarConfiguracionCarrusel(data)
}

export async function guardarConfiguracionPrecios(configuracion) {
  const { data } = await api.post('/api/precios-config', configuracion)
  return data
}
