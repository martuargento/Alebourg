const express = require('express');
const capturarErroresAsincronos = require('../middleware/capturarErroresAsincronos');
const { requerirAdmin } = require('../middleware/auth.middleware');
const {
  obtenerConfiguracionPrecios,
  guardarConfiguracionPrecios,
  obtenerConfiguracionCarrusel,
  guardarConfiguracionCarrusel,
  guardarRitmoCarruselProducto,
} = require('../controllers/configuracion.controller');

const router = express.Router();

router.get('/precios-config', capturarErroresAsincronos(obtenerConfiguracionPrecios));
router.post('/precios-config', requerirAdmin, capturarErroresAsincronos(guardarConfiguracionPrecios));
router.get('/carousel-config', capturarErroresAsincronos(obtenerConfiguracionCarrusel));
router.post('/carousel-config', requerirAdmin, capturarErroresAsincronos(guardarConfiguracionCarrusel));
router.put(
  '/carousel-config/products/:id',
  requerirAdmin,
  capturarErroresAsincronos(guardarRitmoCarruselProducto),
);

module.exports = router;
