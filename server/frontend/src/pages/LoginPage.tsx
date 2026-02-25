import { useState, type FormEvent } from 'react';
import skyBg from '../assets/login-background.png';

export default function LoginPage() {
  const [apiUrl, setApiUrl] = useState('https://localhost:8080/');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${skyBg})`, filter: "blur(3px)" }}
      />
      <div className="absolute inset-0 bg-black/20" />

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
                onChange={(event) => setApiUrl(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 transition focus:ring-2"
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
