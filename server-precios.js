import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint para actualizar preciosUtils.js
app.post('/api/precios-utils', (req, res) => {
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

  const preciosUtilsPath = path.join(__dirname, 'src', 'utils', 'preciosUtils.js');
  fs.writeFile(preciosUtilsPath, ajustarPrecioStr, (err) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo escribir el archivo.' });
    }
    res.json({ ok: true });
  });
});

// Endpoint para obtener preciosUtils.js como texto plano
app.get('/api/precios-utils', (req, res) => {
  if (req.query.raw === '1') {
    const preciosUtilsPath = path.join(__dirname, 'src', 'utils', 'preciosUtils.js');
    fs.readFile(preciosUtilsPath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).send('No se pudo leer el archivo.');
      }
      res.type('text/plain').send(data);
    });
  } else {
    res.status(400).json({ error: 'Parámetro raw=1 requerido' });
  }
});

// --- DESCUENTOS ---
const descuentosPath = path.join(__dirname, 'src', 'utils', 'descuentos.json');

// Obtener reglas de descuento
app.get('/api/descuentos', (req, res) => {
  fs.readFile(descuentosPath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json([]); // Si no existe, devolver vacío
      return res.status(500).json({ error: 'No se pudo leer descuentos.' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ error: 'Descuentos corruptos.' });
    }
  });
});

// Guardar reglas de descuento
app.post('/api/descuentos', (req, res) => {
  const reglas = req.body;
  if (!Array.isArray(reglas)) return res.status(400).json({ error: 'Formato inválido' });
  fs.writeFile(descuentosPath, JSON.stringify(reglas, null, 2), (err) => {
    if (err) return res.status(500).json({ error: 'No se pudo guardar descuentos.' });
    res.json({ ok: true });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de precios corriendo en http://localhost:${PORT}`);
}); 