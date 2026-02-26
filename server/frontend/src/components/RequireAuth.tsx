import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';

export default function RequireAuth() {
  const navigate = useNavigate();
  const authenticated = apiClient.isAuthenticated();

  useEffect(() => {
    if (!authenticated) return;

    let cancelled = false;

    const verifyAuth = async () => {
      const status = await apiClient.checkUserSession();
      if (!status.authenticated && !cancelled) {
        apiClient.clearAuth();
        navigate('/login', { replace: true });
      }
    };

    void verifyAuth();

    return () => {
      cancelled = true;
    };
  }, [authenticated, navigate]);

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
