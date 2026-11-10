const express = require('express');
const { requerirAdmin } = require('../middleware/auth.middleware');
const { iniciarSesion, obtenerPerfil } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', iniciarSesion);
router.get('/perfil', requerirAdmin, obtenerPerfil);

module.exports = router;
