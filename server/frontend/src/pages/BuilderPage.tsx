import { useState } from 'react';
import type { BasicTaskResponse } from '../schemas/general';
import type {
  Platform,
  UserBuildClientRequest,
  UserRegisterClientRequest,
} from '../schemas/user';
import { apiClient, isApiError } from '../services/apiClient';
import { useErrorStore } from '../services/errorStore';

const platformOptions: Platform[] = ['windows', 'mac', 'linux'];

export default function BuilderPage() {
  const addError = useErrorStore((state) => state.addError);
  const apiUrl = apiClient.getApiUrl() ?? 'https://localhost:8000';
  const [registerForm, setRegisterForm] = useState<UserRegisterClientRequest>({
    username: '',
    password: '',
    platform: 'windows',
  });
  const [buildForm, setBuildForm] = useState<UserBuildClientRequest>({
    username: '',
    password: '',
    platform: 'windows',
    apiUrl,
    log: false,
    debug: false,
    static: true,
  });

  const handleRegister = async () => {
    const result = await apiClient.post<BasicTaskResponse, UserRegisterClientRequest>(
      '/user/register-client',
      registerForm,
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }
  };

  const handleBuild = async () => {
    const result = await apiClient.postForDownload<UserBuildClientRequest>(
      '/user/build-client',
      buildForm,
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename ?? `${buildForm.username}-client.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="theme-surface p-8">
        <p className="theme-kicker">Builder</p>
        <h2 className="theme-page-title mt-3">Register client identity</h2>
        <p className="theme-page-copy mt-3">
          Create a client record without building a new binary. Useful when credentials and
          platform are known ahead of deployment.
        </p>
        <div className="mt-6 space-y-4">
          <input
            className="theme-input"
            placeholder="Client username"
            value={registerForm.username}
            onChange={(event) =>
              setRegisterForm((state) => ({ ...state, username: event.target.value }))
            }
          />
          <input
            className="theme-input"
            placeholder="Client password"
            type="password"
            value={registerForm.password}
            onChange={(event) =>
              setRegisterForm((state) => ({ ...state, password: event.target.value }))
            }
          />
          <select
            className="theme-select"
            value={registerForm.platform}
            onChange={(event) =>
              setRegisterForm((state) => ({
                ...state,
                platform: event.target.value as Platform,
              }))
            }
          >
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <button className="theme-button-primary" onClick={handleRegister}>
            Register client
          </button>
        </div>
      </section>

      <section className="theme-surface p-8">
        <p className="theme-kicker">Builder</p>
        <h2 className="theme-page-title mt-3">Compile operator client</h2>
        <p className="theme-page-copy mt-3">
          Produce a platform-specific client bundle and download it directly from the server.
        </p>
        <div className="mt-6 space-y-4">
          <input
            className="theme-input"
            placeholder="Client username"
            value={buildForm.username}
            onChange={(event) =>
              setBuildForm((state) => ({ ...state, username: event.target.value }))
            }
          />
          <input
            className="theme-input"
            placeholder="Client password"
            type="password"
            value={buildForm.password}
            onChange={(event) =>
              setBuildForm((state) => ({ ...state, password: event.target.value }))
            }
          />
          <input
            className="theme-input"
            placeholder="API URL"
            value={buildForm.apiUrl}
            onChange={(event) =>
              setBuildForm((state) => ({ ...state, apiUrl: event.target.value }))
            }
          />
          <select
            className="theme-select"
            value={buildForm.platform}
            onChange={(event) =>
              setBuildForm((state) => ({
                ...state,
                platform: event.target.value as Platform,
              }))
            }
          >
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <label className="theme-surface-soft flex items-center gap-3 px-4 py-3 text-sm text-slate-700">
            <input
              checked={buildForm.log}
              type="checkbox"
              onChange={(event) =>
                setBuildForm((state) => ({ ...state, log: event.target.checked }))
              }
            />
            Enable runtime logging
          </label>
          <label className="theme-surface-soft flex items-center gap-3 px-4 py-3 text-sm text-slate-700">
            <input
              checked={buildForm.debug}
              type="checkbox"
              onChange={(event) =>
                setBuildForm((state) => ({ ...state, debug: event.target.checked }))
              }
            />
            Include debug mode
          </label>
          <label className="theme-surface-soft flex items-center gap-3 px-4 py-3 text-sm text-slate-700">
            <input
              checked={buildForm.static}
              type="checkbox"
              onChange={(event) =>
                setBuildForm((state) => ({ ...state, static: event.target.checked }))
              }
            />
            Build static binary
          </label>
          <button className="theme-button-primary" onClick={handleBuild}>
            Build and download
          </button>
        </div>
      </section>
    </div>
  );
}
