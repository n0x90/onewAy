import { Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import RootRedirect from './components/RootRedirect';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
