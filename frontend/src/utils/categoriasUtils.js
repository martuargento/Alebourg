export function normalizarCategoriaParaUrl(nombre) {
  if (!nombre) return '';
  return nombre
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[/&]+/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sonCategoriasIguales(categoriaA, categoriaB) {
  return normalizarCategoriaParaUrl(categoriaA) === normalizarCategoriaParaUrl(categoriaB);
}
