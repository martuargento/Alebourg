import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, password } = req.body || {};

    // Autenticación básica basada en credenciales existentes en el frontend
    const VALID_EMAIL = 'martinalejandronuniez@gmail.com';
    const VALID_PASSWORD = 'alebourg912';

    if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const secret = process.env.JWT_SECRET || 'alebourg_super_secret_key_replace_in_env';
    const token = jwt.sign(
      { email, esAdmin: true },
      secret,
      { expiresIn: '8h' }
    );

    return res.json({ token, user: { email, esAdmin: true } });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}


