import { useEffect, useMemo, useState } from 'react';
import type { BasicTaskResponse } from '../schemas/general';
import type { UserModuleCatalogResponse } from '../schemas/user';
import { apiClient, isApiError } from '../services/apiClient';
import { useErrorStore } from '../services/errorStore';

type UploadMode = 'upload' | 'update-remote';

export default function ModulesPage() {
  const addError = useErrorStore((state) => state.addError);
  const [modules, setModules] = useState<UserModuleCatalogResponse['modules']>([]);
  const [search, setSearch] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('upload');

  const loadModules = async () => {
    const result = await apiClient.get<UserModuleCatalogResponse>('/user/modules');
    if (isApiError(result)) {
      addError(result);
      return;
    }

    setModules(result.modules);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrapModules = async () => {
      const result = await apiClient.get<UserModuleCatalogResponse>('/user/modules');
      if (cancelled) {
        return;
      }

      if (isApiError(result)) {
        addError(result);
        return;
      }

      setModules(result.modules);
    };

    void bootstrapModules();

    return () => {
      cancelled = true;
    };
  }, [addError]);

  const filteredModules = useMemo(
    () =>
      modules.filter((module) =>
        module.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [modules, search],
  );

  const handleLocalAction = async (
    endpoint: 'install' | 'update-local',
    moduleName: string,
  ) => {
    const result = await apiClient.post<BasicTaskResponse, Record<string, never>>(
      `/user/modules/${endpoint}?module_name=${encodeURIComponent(moduleName)}`,
      {},
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    await loadModules();
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const endpoint =
      uploadMode === 'upload' ? '/user/modules/upload' : '/user/modules/update-remote';
    const result = await apiClient.postForm<BasicTaskResponse>(endpoint, formData);
    if (isApiError(result)) {
      addError(result);
      return;
    }

    setFiles(null);
    await loadModules();
  };

  return (
    <div className="space-y-6">
      <section className="theme-surface p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="theme-kicker">Modules</p>
            <h2 className="theme-page-title mt-3">Module catalog</h2>
            <p className="theme-page-copy mt-3 max-w-2xl">
              Track what is installed in the database, what exists locally on disk, and where
              versions have drifted.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <label className="theme-kicker mb-2 block">Filter modules</label>
            <input
              className="theme-input"
              placeholder="Search by module name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="theme-surface p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <p className="theme-kicker">Remote package</p>
            <input
              className="theme-input mt-3"
              multiple
              type="file"
              onChange={(event) => setFiles(event.target.files)}
            />
          </div>
          <div className="w-full lg:max-w-xs">
            <p className="theme-kicker mb-3">Mode</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={uploadMode === 'upload' ? 'theme-button-primary' : 'theme-button-secondary'}
                onClick={() => setUploadMode('upload')}
              >
                Upload new
              </button>
              <button
                type="button"
                className={uploadMode === 'update-remote' ? 'theme-button-primary' : 'theme-button-secondary'}
                onClick={() => setUploadMode('update-remote')}
              >
                Update remote
              </button>
            </div>
          </div>
          <button className="theme-button-primary lg:min-w-44" onClick={handleUpload}>
            Submit package
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredModules.map((module) => (
          <article key={module.name} className="theme-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="theme-kicker">Module</p>
                <h3 className="mt-2 text-xl font-semibold text-sky-950">{module.name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {module.description ?? 'No description provided.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className={module.inDatabase ? 'theme-badge-online' : 'theme-badge-offline'}>
                  {module.inDatabase ? 'In DB' : 'Not in DB'}
                </span>
                <span className={module.hasLocalDirectory ? 'theme-badge-online' : 'theme-badge-offline'}>
                  {module.hasLocalDirectory ? 'Local dir' : 'No local dir'}
                </span>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="theme-surface-soft p-4 text-sm text-slate-700">
                <p className="theme-kicker">Database</p>
                <p className="mt-2">{module.version ?? 'N/A'}</p>
              </div>
              <div className="theme-surface-soft p-4 text-sm text-slate-700">
                <p className="theme-kicker">Local</p>
                <p className="mt-2">{module.localVersion ?? 'N/A'}</p>
              </div>
              <div className="theme-surface-soft p-4 text-sm text-slate-700">
                <p className="theme-kicker">Installed Clients</p>
                <p className="mt-2">{module.installedClientCount}</p>
              </div>
              <div className="theme-surface-soft p-4 text-sm text-slate-700">
                <p className="theme-kicker">Platforms</p>
                <p className="mt-2">
                  {[
                    module.supportsWindows ? 'Windows' : null,
                    module.supportsMac ? 'Mac' : null,
                    module.supportsLinux ? 'Linux' : null,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'None'}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {module.hasLocalDirectory && !module.inDatabase && (
                <button
                  className="theme-button-primary"
                  onClick={() => handleLocalAction('install', module.name)}
                >
                  Install local
                </button>
              )}
              {module.hasLocalDirectory &&
                module.inDatabase &&
                module.localVersion &&
                module.version !== module.localVersion && (
                  <button
                    className="theme-button-secondary"
                    onClick={() => handleLocalAction('update-local', module.name)}
                  >
                    Sync local changes
                  </button>
                )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
