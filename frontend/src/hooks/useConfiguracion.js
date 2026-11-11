import { useQuery } from '@tanstack/react-query';
import { obtenerConfiguracionCarrusel, obtenerConfiguracionPrecios } from '../api/configuracion';

export const priceConfigQueryKey = ['precios-config'];
export const carouselConfigQueryKey = ['carousel-config'];

export function usePreciosConfig() {
  return useQuery({
    queryKey: priceConfigQueryKey,
    queryFn: obtenerConfiguracionPrecios,
    staleTime: 5 * 60_000,
  });
}

export function useCarruselConfig() {
  return useQuery({
    queryKey: carouselConfigQueryKey,
    queryFn: obtenerConfiguracionCarrusel,
    staleTime: 10_000,
  });
}
