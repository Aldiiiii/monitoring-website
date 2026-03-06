import { useQuery } from '@tanstack/react-query';
import { fetchMe, AuthUser } from './api';

export function useAuth() {
  return useQuery<AuthUser | null>({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 60_000,
  });
}
