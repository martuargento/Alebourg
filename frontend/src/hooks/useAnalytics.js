import { useQuery } from '@tanstack/react-query';
import { obtenerMetricas } from '../api/analytics';

export function useMetricas(params, enabled = true) {
  return useQuery({
    queryKey: ['metricas', params],
    queryFn: () => obtenerMetricas(params),
    enabled,
  });
}
