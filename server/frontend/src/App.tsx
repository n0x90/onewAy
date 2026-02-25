import LoginPage from './pages/LoginPage';
import { Navigate, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<h1 className="text-xl font-bold text-red-700">Hello World!</h1>}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
