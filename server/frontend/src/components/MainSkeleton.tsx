import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import type { BasicTaskResponse } from '../schemas/general';
import { wsManager } from '../schemas/wsManager';
import { apiClient, isApiError } from '../services/apiClient';
import { useErrorStore } from '../services/errorStore';
import ErrorStack from './ErrorStack';
import SideBar from './SideBar';
import TopBar from './TopBar';

type UserMeResponse = {
  username: string;
};

export default function MainSkeleton() {
  const navigate = useNavigate();
  const addError = useErrorStore((state) => state.addError);
  const [username, setUsername] = useState<string | null>(null);
  const [metasploitAvailable, setMetasploitAvailable] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    wsManager.retain();

    return () => {
      wsManager.release();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadShellState = async () => {
      const [userResult, metasploitResult] = await Promise.all([
        apiClient.get<UserMeResponse>('/user/me'),
        apiClient.get<BasicTaskResponse>('/user/metasploit/check'),
      ]);

      if (!cancelled) {
        if (isApiError(userResult)) {
          addError(userResult);
        } else {
          setUsername(userResult.username);
        }

        if (!isApiError(metasploitResult) && metasploitResult.result === 'success') {
          setMetasploitAvailable(true);
        } else {
          setMetasploitAvailable(false);
        }
      }
    };

    void loadShellState();

    return () => {
      cancelled = true;
    };
  }, [addError]);

  const handleLogout = async () => {
    setLoggingOut(true);
    const result = await apiClient.get<BasicTaskResponse>('/user/logout');
    setLoggingOut(false);

    if (isApiError(result)) {
      addError(result);
      return;
    }

    apiClient.clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="theme-shell">
      <ErrorStack />
      <TopBar loggingOut={loggingOut} onLogout={handleLogout} username={username} />
      <div className="flex flex-col lg:flex-row">
        <SideBar metasploitAvailable={metasploitAvailable} />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
