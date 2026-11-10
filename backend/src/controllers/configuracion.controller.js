const { prisma } = require('../lib/prisma');

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

module.exports = {
  obtenerConfiguracionPrecios,
  guardarConfiguracionPrecios,
};
