const express = require('express');
const capturarErroresAsincronos = require('../middleware/capturarErroresAsincronos');
const { listaDeProductos, obtenerProducto } = require('../controllers/product.controller');

const router = express.Router();

router.get('/', capturarErroresAsincronos(listaDeProductos));
router.get('/:id', capturarErroresAsincronos(obtenerProducto));

module.exports = router;
