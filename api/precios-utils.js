import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { rangos, ajusteEspecial, formatearPrecio } = req.body;

    if (!Array.isArray(rangos)) {
      return res.status(400).json({ error: 'Rangos inválidos' });
    }

    // Generar la función ajustarPrecio con los nuevos rangos
    let ajustarPrecioStr = `// Función para parsear el precio desde el string del JSON\n`;
    ajustarPrecioStr += `export const parsearPrecio = (precioStr) => {\n  const precioLimpio = precioStr.trim().replace(/,/g, '');\n  return parseFloat(precioLimpio);\n};\n\n`;
    ajustarPrecioStr += `export const redondearA500 = (precio) => {\n  return Math.floor(precio / 500) * 500;\n};\n\n`;
    ajustarPrecioStr += `export const ajustarPrecio = (precioOriginal, titulo = '', categoria = '') => {\n  const precio = parsearPrecio(precioOriginal);\n  let precioAjustado = precio;\n`;
    
    if (ajusteEspecial) {
      ajustarPrecioStr += `  // Ajuste especial\n  ${ajusteEspecial}\n`;
    }
    
    ajustarPrecioStr += `  // Aplicar ajustes según rangos\n`;
    for (let i = 0; i < rangos.length; i++) {
      const r = rangos[i];
      if (i === 0) {
        ajustarPrecioStr += `  if (precio < ${r.limite}) precioAjustado += ${r.monto};\n`;
      } else if (i < rangos.length - 1) {
        ajustarPrecioStr += `  else if (precio < ${r.limite}) precioAjustado += ${r.monto};\n`;
      }
    }
    
    // Último rango (mayor o igual)
    const last = rangos[rangos.length-1];
    ajustarPrecioStr += `  else if (precio >= ${last.limite}) precioAjustado += ${last.monto};\n`;
    
    // Lógica especial para auriculares
    ajustarPrecioStr += `\n  // Lógica especial para auriculares\n  if (categoria.trim().toLowerCase() === 'auriculares' && redondearA500(precioAjustado) < 4000) {\n    return 4000;\n  }\n`;
    ajustarPrecioStr += `\n  return redondearA500(precioAjustado);\n};\n\n`;
    ajustarPrecioStr += `export const formatearPrecio = ${formatearPrecio || '(precio) => precio.toLocaleString(\'es-AR\')'};\n`;

    // En Vercel, escribimos en /tmp ya que es la única carpeta escribible
    const preciosUtilsPath = '/tmp/preciosUtils.js';
    try {
      fs.writeFileSync(preciosUtilsPath, ajustarPrecioStr);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'No se pudo escribir el archivo.' });
    }
  } else if (req.method === 'GET') {
    if (req.query.raw === '1') {
      try {
        // Leer desde /tmp si existe, sino devolver contenido por defecto
        const preciosUtilsPath = '/tmp/preciosUtils.js';
        if (fs.existsSync(preciosUtilsPath)) {
          const data = fs.readFileSync(preciosUtilsPath, 'utf8');
          res.type('text/plain').send(data);
        } else {
          // Contenido por defecto
          const defaultContent = `// Función para parsear el precio desde el string del JSON
export const parsearPrecio = (precioStr) => {
  const precioLimpio = precioStr.trim().replace(/,/g, '');
  return parseFloat(precioLimpio);
};

export const redondearA500 = (precio) => {
  return Math.floor(precio / 500) * 500;
};

export const ajustarPrecio = (precioOriginal, titulo = '', categoria = '') => {
  const precio = parsearPrecio(precioOriginal);
  let precioAjustado = precio;
  
  // Aplicar ajustes según rangos
  if (precio < 10000) precioAjustado += 2000;
  else if (precio < 25000) precioAjustado += 3000;
  else if (precio >= 25000) precioAjustado += 4000;
  
  // Lógica especial para auriculares
  if (categoria.trim().toLowerCase() === 'auriculares' && redondearA500(precioAjustado) < 4000) {
    return 4000;
  }
  
  return redondearA500(precioAjustado);
};

export const formatearPrecio = (precio) => precio.toLocaleString('es-AR');`;
          res.type('text/plain').send(defaultContent);
        }
      } catch (err) {
        res.status(500).send('No se pudo leer el archivo.');
      }
    } else {
      res.status(400).json({ error: 'Parámetro raw=1 requerido' });
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' });
  }
}
