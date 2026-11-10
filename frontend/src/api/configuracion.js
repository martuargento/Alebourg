import api from './client';

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
