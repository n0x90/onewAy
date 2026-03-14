import { Route, Routes } from 'react-router-dom';
import MainSkeleton from './components/MainSkeleton';
import RequireAuth from './components/RequireAuth';
import RootRedirect from './components/RootRedirect';
import BuilderPage from './pages/BuilderPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ClientsPage from './pages/ClientsPage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import MetasploitPage from './pages/MetasploitPage';
import ModulesPage from './pages/ModulesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<MainSkeleton />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:clientUsername" element={<ClientDetailPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/metasploit" element={<MetasploitPage />} />
          <Route path="/builder" element={<BuilderPage />} />
        </Route>
      </Route>
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
