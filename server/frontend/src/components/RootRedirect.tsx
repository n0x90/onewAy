import { Navigate } from 'react-router-dom';
import { apiClient } from '../services/apiClient';

export default function RootRedirect() {
  return <Navigate to={apiClient.isAuthenticated() ? '/dashboard' : '/login'} replace />;
}
