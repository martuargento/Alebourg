import api from './client'

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

export async function guardarConfiguracionPrecios(configuracion) {
  const { data } = await api.post('/api/precios-config', configuracion)
  return data
}
