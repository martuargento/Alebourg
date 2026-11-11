const express = require('express');
const capturarErroresAsincronos = require('../middleware/capturarErroresAsincronos');
const { requerirAdmin } = require('../middleware/auth.middleware');
const {
  listaDeProductos,
  obtenerProducto,
  obtenerConfigProductos,
  guardarConfigProductos,
  guardarPersonalizacion,
  crearProductoManual,
  marcarProductoRevisado,
  subirImagenProducto,
  obtenerDestacados,
} = require('../controllers/product.controller');

const router = express.Router();

router.get('/', capturarErroresAsincronos(listaDeProductos));
router.get('/destacados', capturarErroresAsincronos(obtenerDestacados));
router.get('/admin/config', requerirAdmin, capturarErroresAsincronos(obtenerConfigProductos));
router.put('/admin/config', requerirAdmin, capturarErroresAsincronos(guardarConfigProductos));
router.post('/admin/productos', requerirAdmin, capturarErroresAsincronos(crearProductoManual));
router.put('/:id/admin', requerirAdmin, capturarErroresAsincronos(guardarPersonalizacion));
router.post('/:id/revisado', requerirAdmin, capturarErroresAsincronos(marcarProductoRevisado));
router.post(
  '/:id/imagenes',
  requerirAdmin,
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '4mb' }),
  capturarErroresAsincronos(subirImagenProducto),
);
router.get('/:id', capturarErroresAsincronos(obtenerProducto));

module.exports = router;
