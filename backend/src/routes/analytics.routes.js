const express = require('express');
const capturarErroresAsincronos = require('../middleware/capturarErroresAsincronos');
const { requerirAdmin } = require('../middleware/auth.middleware');
const { registrarEvento, obtenerMetricas } = require('../controllers/analytics.controller');

const router = express.Router();
router.post('/', capturarErroresAsincronos(registrarEvento));
router.get('/', requerirAdmin, capturarErroresAsincronos(obtenerMetricas));

module.exports = router;
