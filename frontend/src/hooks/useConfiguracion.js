import { useQuery } from '@tanstack/react-query';
import { obtenerConfiguracionPrecios } from '../api/configuracion';

export const priceConfigQueryKey = ['precios-config'];

export function usePreciosConfig() {
  return useQuery({
    queryKey: priceConfigQueryKey,
    queryFn: obtenerConfiguracionPrecios,
    staleTime: 5 * 60_000,
  });
}
