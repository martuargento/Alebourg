const { verificarTokenAdmin } = require('../data/auth');

function requerirAdmin(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Se requiere iniciar sesión como administrador.' });
  }

  try {
    const payload = verificarTokenAdmin(token);
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Permisos insuficientes.' });
    }
    req.admin = { email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: 'La sesión venció. Volvé a iniciar sesión.' });
  }
}

module.exports = { requerirAdmin };
