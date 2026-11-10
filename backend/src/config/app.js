const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('../routes/auth.routes');
const productosRoutes = require('../routes/productos.routes');
const categoriasRoutes = require('../routes/categorias.routes');
const configuracionRoutes = require('../routes/configuracion.routes');
const analyticsRoutes = require('../routes/analytics.routes');

const app = express();
const originsPermitidos = (process.env.CORS_ORIGINS || [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || originsPermitidos.includes(origin)) return callback(null, true);
    const error = new Error('Origen no permitido por CORS.');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'alebourg-backend' }));
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api', configuracionRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('Error en solicitud API:', error);
  const status = error.statusCode || (error.type === 'entity.too.large' ? 413 : 500);
  return res.status(status).json({
    error: status === 500 ? 'Error interno del servidor.' : error.message,
  });
});

module.exports = app;
