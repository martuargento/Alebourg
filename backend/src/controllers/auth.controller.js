const { timingSafeEqual } = require('node:crypto');
const { crearTokenAdmin } = require('../data/auth');

function coincideEnTiempoConstante(actual, esperado) {
  const actualBuffer = Buffer.from(actual);
  const esperadoBuffer = Buffer.from(esperado);
  return actualBuffer.length === esperadoBuffer.length
    && timingSafeEqual(actualBuffer, esperadoBuffer);
}

function iniciarSesion(req, res) {
  const emailConfigurado = process.env.ADMIN_EMAIL;
  const passwordConfigurada = process.env.ADMIN_PASSWORD;
  if (!emailConfigurado || !passwordConfigurada) {
    return res.status(503).json({ error: 'Configurá ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env.' });
  }

  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  const emailValido = coincideEnTiempoConstante(email.toLowerCase(), emailConfigurado.toLowerCase());
  const passwordValida = coincideEnTiempoConstante(password, passwordConfigurada);
  if (!emailValido || !passwordValida) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
  }
  return res.json({ access: crearTokenAdmin(emailConfigurado) });
}

function obtenerPerfil(req, res) {
  return res.json({ email: req.admin.email, role: 'admin' });
}

module.exports = { iniciarSesion, obtenerPerfil };
