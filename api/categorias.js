import fs from 'fs';
import path from 'path';
import { getSupabaseServerClient } from './_supabaseClient.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Intentar leer desde Supabase
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.from('productos').select('categoria');
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        const categoriasMap = {};
        data.forEach(({ categoria }) => {
          if (!categoria) return;
          const c = categoria.trim();
          if (c) categoriasMap[c] = (categoriasMap[c] || 0) + 1;
        });
        const categorias = Object.entries(categoriasMap)
          .map(([nombre, cantidad]) => ({ 
            nombre: nombre.replace(/([A-Z])/g, ' $1').trim(), 
            nombreOriginal: nombre,
            cantidad 
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        return res.json(categorias);
      }
    }
  } catch (err) {
    console.warn('Supabase no disponible, usando JSON local:', err.message);
  }

  const productosPath = path.join(process.cwd(), 'public', 'productosalebourgactulizados.json');

  try {
    if (!fs.existsSync(productosPath)) {
      return res.json([]);
    }

    const data = fs.readFileSync(productosPath, 'utf8');
    const productos = JSON.parse(data);
    
    const categoriasMap = {};
    productos.forEach(producto => {
      if (!producto.categoria) return;
      const categoria = producto.categoria.trim();
      if (categoria) {
        const categoriaSeparada = categoria.replace(/([A-Z])/g, ' $1').trim();
        categoriasMap[categoria] = (categoriasMap[categoria] || 0) + 1;
      }
    });

    const categorias = Object.entries(categoriasMap)
      .map(([nombre, cantidad]) => ({ 
        nombre: nombre.replace(/([A-Z])/g, ' $1').trim(), 
        nombreOriginal: nombre,
        cantidad 
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer productos.' });
  }
}
