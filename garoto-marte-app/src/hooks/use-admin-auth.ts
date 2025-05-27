import { useAuth } from '@/contexts/auth-context';

export const useAdminAuth = () => {
  const auth = useAuth();
  
  const isAdmin = auth.user !== null;
  const isLoading = auth.loading;
  
  return {
    ...auth,
    isAdmin,
    isLoading,
  };
};
