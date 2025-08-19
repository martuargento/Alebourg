// Normaliza un nombre de categoría a un slug consistente
export const slugifyCategory = (name) => {
  if (!name) return '';
  return name
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sin acentos
    .replace(/[\/&]+/g, ' ') // reemplazar separadores por espacio
    .replace(/[^a-z0-9]+/g, '-') // cualquier no alfanumérico por guion
    .replace(/^-+|-+$/g, ''); // quitar guiones extremos
};

// Para comparar, es mejor comparar slugs (no remover guiones arbitrariamente)
export const categorySlugEquals = (a, b) => slugifyCategory(a) === slugifyCategory(b);


