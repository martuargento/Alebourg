import { BACKEND_URL } from '../config';

// Cache para productos
let productosCache = null;
let categoriasCache = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para limpiar cache si ha expirado
const isCacheValid = () => {
  return productosCache && (Date.now() - lastFetch) < CACHE_DURATION;
};

// Obtener todos los productos
export const getProductos = async () => {
  if (isCacheValid()) {
    return productosCache;
  }

  // Intentar primero desde el backend (Supabase). Si falla, usar JSON local como fallback
  try {
    // Pide todo sin paginar (backend hace paginado interno). Si querés, podemos pasar page/pageSize
    const response = await fetch(`${BACKEND_URL}/api/productos?_=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const productos = await response.json();
    // Sanitizar campos críticos
    const sane = productos
      .filter(p => p && typeof p.id !== 'undefined' && p.titulo)
      .map(p => ({
        ...p,
        categoria: (p.categoria || '').toString(),
        titulo: p.titulo.toString(),
      }));
    productosCache = sane;
    lastFetch = Date.now();
    return sane;
  } catch (err) {
    console.warn('Fallo obteniendo productos desde backend, usando archivo local:', err.message);
    try {
      const module = await import('../assets/productosalebourgactulizados.json');
      const productos = module.default;
      productosCache = productos;
      lastFetch = Date.now();
      return productos;
    } catch (error) {
      console.error('Error al obtener productos locales:', error);
      return [];
    }
  }
};

// Obtener producto por ID
export const getProductoById = async (id) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/productos/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error al obtener producto:', error);
    // Fallback: buscar en productos locales
    const productos = await getProductos();
    return productos.find(p => p.id === parseInt(id)) || null;
  }
};

// Obtener categorías
export const getCategorias = async () => {
  if (categoriasCache && isCacheValid()) {
    return categoriasCache;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/categorias`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const categorias = await response.json();
    categoriasCache = categorias;
    return categorias;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    // Fallback: generar categorías desde productos locales
    const productos = await getProductos();
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

    categoriasCache = categorias;
    return categorias;
  }
};

// Limpiar cache (útil para forzar recarga)
export const clearCache = () => {
  productosCache = null;
  categoriasCache = null;
  lastFetch = 0;
};
