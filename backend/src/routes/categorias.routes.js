const express = require('express');
const capturarErroresAsincronos = require('../middleware/capturarErroresAsincronos');
const { listaDeCategorias } = require('../controllers/categorias.controller');

const router = express.Router();
router.get('/', capturarErroresAsincronos(listaDeCategorias));

module.exports = router;
