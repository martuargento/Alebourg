import { useQuery } from '@tanstack/react-query';
import { obtenerCategorias, obtenerProducto, obtenerProductos } from '../api/products';

export const productQueryKey = ['productos'];
export const categoryQueryKey = ['categorias'];

export function useProductos() {
  return useQuery({
    queryKey: productQueryKey,
    queryFn: obtenerProductos,
    staleTime: 60_000,
  });
}

export function useProducto(id) {
  return useQuery({
    queryKey: [...productQueryKey, id],
    queryFn: () => obtenerProducto(id),
    enabled: Boolean(id),
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: categoryQueryKey,
    queryFn: obtenerCategorias,
    staleTime: 5 * 60_000,
  });
}
