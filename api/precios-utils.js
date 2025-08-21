import fs from 'fs';
import path from 'path';

// Utilidades de precio replicadas en backend para evitar exponer lógica sensible
const parsearPrecio = (precioStr) => {
  const precioLimpio = String(precioStr).trim().replace(/,/g, '');
  const num = parseFloat(precioLimpio);
  return Number.isNaN(num) ? 0 : num;
};

const redondearA500 = (precio) => {
  return Math.floor(precio / 500) * 500;
};

export const ajustarPrecioServidor = (precioOriginal, titulo = '', categoria = '') => {
  const precio = parsearPrecio(precioOriginal);
  let precioAjustado = precio;
  if (String(titulo).toLowerCase().startsWith('cable') && precio < 3000) {
    precioAjustado += 3500;
    return redondearA500(precioAjustado);
  }
  if (precio < 1500) precioAjustado += 1500;
  else if (precio < 2000) precioAjustado += 2500;
  else if (precio < 3000) precioAjustado += 3000;
  else if (precio < 4000) precioAjustado += 4500;
  else if (precio < 5000) precioAjustado += 5000;
  else if (precio < 6000) precioAjustado += 5000;
  else if (precio < 7000) precioAjustado += 5000;
  else if (precio < 8000) precioAjustado += 5500;
  else if (precio < 9000) precioAjustado += 5500;
  else if (precio < 10000) precioAjustado += 6000;
  else if (precio < 11000) precioAjustado += 6500;
  else if (precio < 12000) precioAjustado += 6500;
  else if (precio < 13000) precioAjustado += 6500;
  else if (precio < 14000) precioAjustado += 6500;
  else if (precio < 15000) precioAjustado += 7000;
  else if (precio < 16000) precioAjustado += 7500;
  else if (precio < 30000) precioAjustado += 11000;
  else if (precio < 40000) precioAjustado += 13000;
  else if (precio < 50000) precioAjustado += 18000;
  else if (precio < 60000) precioAjustado += 20000;
  else if (precio < 70000) precioAjustado += 22000;
  else if (precio < 80000) precioAjustado += 25000;
  else if (precio < 100000) precioAjustado += 30000;
  else if (precio >= 100001) precioAjustado += 35000;
  if (String(categoria).trim().toLowerCase() === 'auriculares' && redondearA500(precioAjustado) < 4000) {
    return 4000;
  }
  return redondearA500(precioAjustado);
};

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
