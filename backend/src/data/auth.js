const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET_KEY
  || (process.env.NODE_ENV === 'production' ? '' : 'alebourg-local-development-secret');

if (!jwtSecret) {
  throw new Error('JWT_SECRET_KEY es obligatorio en producción.');
}

function crearTokenAdmin(email) {
  return jwt.sign({ role: 'admin', email }, jwtSecret, { expiresIn: '2h' });
}

function verificarTokenAdmin(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { crearTokenAdmin, verificarTokenAdmin };
