import fs from 'fs';
import path from 'path';
import { getSupabaseServerClient } from '../_supabaseClient.js';
import jwt from 'jsonwebtoken';
import { ajustarPrecioServidor } from '../precios-utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id } = req.query;
  // Verificar token opcional (admin)
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  let esAdmin = false;
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || 'alebourg_super_secret_key_replace_in_env';
      const payload = jwt.verify(token, secret);
      esAdmin = !!payload?.esAdmin;
    } catch (_) {
      esAdmin = false;
    }
  }

  // Intentar leer desde Supabase si está configurado
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', parseInt(id))
        .limit(1)
        .single();
      if (error) throw error;
      if (data) {
        const precioBase = (data.precio || 0).toString();
        const precioAjustado = ajustarPrecioServidor(precioBase, data.titulo, data.categoria);
        if (esAdmin) {
          return res.json({ ...data, precio: precioBase, precioAjustado });
        }
        const { precio, ...rest } = data;
        return res.json({ ...rest, precio: precioAjustado.toString() });
      }
    }
  } catch (err) {
    console.warn('Supabase no disponible o error al leer, usando JSON local. Detalle:', err.message);
  }

  // Fallback al JSON local
  const productosPath = path.join(process.cwd(), 'public', 'productosalebourgactulizados.json');

  try {
    if (!fs.existsSync(productosPath)) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const data = fs.readFileSync(productosPath, 'utf8');
    const productos = JSON.parse(data);
    const producto = productos.find(p => p.id === parseInt(id));

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const precioBase = (producto.precio || 0).toString();
    const precioAjustado = ajustarPrecioServidor(precioBase, producto.titulo, producto.categoria);
    if (esAdmin) {
      return res.json({ ...producto, precio: precioBase, precioAjustado });
    }
    const { precio, ...rest } = producto;
    res.json({ ...rest, precio: precioAjustado.toString() });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer productos.' });
  }
}
