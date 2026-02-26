import {
  useCallback,
  useEffect,
  useState,
  type FocusEvent,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import skyBg from '../assets/login-background.png';
import { apiClient, isApiError } from '../services/apiClient';
import type {
  UserAuthLoginRequest,
  UserAuthLoginResponse,
} from '../schemas/clientAuth';
import { Severity, useErrorStore } from '../services/errorStore';

type ApiUrlValidationState = 'unchecked' | 'valid' | 'invalid';

export default function LoginPage() {
  const navigate = useNavigate();
  const [initialApiUrl] = useState(() => apiClient.getApiUrl() ?? 'https://localhost:8000');
  const [apiUrl, setApiUrl] = useState(initialApiUrl);
  const [apiUrlValidationState, setApiUrlValidationState] =
    useState<ApiUrlValidationState>('unchecked');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const errors = useErrorStore((state) => state.errors);
  const addError = useErrorStore((state) => state.addError);
  const clearErrors = useErrorStore((state) => state.clearErrors);
  const apiUrlInputValidationClass =
    apiUrlValidationState === 'valid'
      ? 'border-green-500 ring-green-500 focus:border-green-500 focus:ring-green-500'
      : apiUrlValidationState === 'invalid'
        ? 'border-red-500 ring-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-300 ring-sky-500 focus:border-slate-300 focus:ring-sky-500';

  const validateApiUrl = useCallback(async (url: string): Promise<boolean> => {
    const result = await apiClient.validateUrl(url);
    setApiUrlValidationState(result ? 'valid' : 'invalid');

    if (result) {
      apiClient.setApiUrl(url);
    }

    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkExistingSession = async () => {
      if (apiClient.isAuthenticated()) {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (!apiClient.getApiUrl()) {
        const valid = await validateApiUrl(initialApiUrl);
        if (!valid || cancelled) return;
      } else {
        setApiUrlValidationState('valid');
      }

      const status = await apiClient.checkUserSession();
      if (cancelled || !status.authenticated) return;

      apiClient.setAuthenticated(true);
      navigate('/dashboard', { replace: true });
    };

    void checkExistingSession();

    return () => {
      cancelled = true;
    };
  }, [initialApiUrl, navigate, validateApiUrl]);

  const handleApiUrlBlur = async (event: FocusEvent<HTMLInputElement>) => {
    const url = event.currentTarget.value;
    if (url.length === 0) {
      setApiUrlValidationState('unchecked');
      return;
    }

    await validateApiUrl(url);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearErrors();

    if (
      apiUrlValidationState !== 'valid' ||
      apiClient.getApiUrl() !== apiUrl
    ) {
      const result = await validateApiUrl(apiUrl);

      if (!result) {
        addError({
          severity: Severity.Error,
          message: 'API URL validation failed',
        });
        return;
      }
    }

    const data: UserAuthLoginRequest = { username, password };
    const result = await apiClient.post<UserAuthLoginResponse, UserAuthLoginRequest>(
      '/user/auth/login',
      data,
    );

    if (isApiError(result)) {
      addError(result);
      return;
    }

    apiClient.setAuthenticated(true);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${skyBg})`, filter: 'blur(3px)' }}
      />
      <div className="absolute inset-0 bg-black/20" />

      {errors.length > 0 && (
        <div className="absolute left-1/2 top-6 z-20 w-full max-w-lg -translate-x-1/2 px-4">
          <div className="space-y-2">
            {errors.map((err) => (
              <div
                key={err.id}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700 shadow"
              >
                {err.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/80 p-8 shadow-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-700 font-mono text-center tracking-widest">
              onewAy
            </h1>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="api-url">
                API Url
              </label>
              <input
                id="api-url"
                name="api-url"
                type="url"
                placeholder="https://localhost:8000"
                value={apiUrl}
                onChange={(event) => {
                  setApiUrl(event.target.value);
                  setApiUrlValidationState('unchecked');
                }}
                onBlur={handleApiUrlBlur}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:ring-2 ${apiUrlInputValidationClass}`}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
