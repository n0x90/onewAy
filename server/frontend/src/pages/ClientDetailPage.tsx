import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { BasicTaskResponse } from '../schemas/general';
import type {
  UserModuleCatalogResponse,
  UserQueryClientAllInfoResponse,
  UserQueryClientJobsResponse,
  UserRunModuleRequest,
} from '../schemas/user';
import { apiClient, isApiError } from '../services/apiClient';
import { useErrorStore } from '../services/errorStore';
import { useLiveClientStore } from '../services/liveClientStore';
import { formatDateTime } from '../utils';

export default function ClientDetailPage() {
  const { clientUsername } = useParams<{ clientUsername: string }>();
  const addError = useErrorStore((state) => state.addError);
  const [clientInfo, setClientInfo] = useState<UserQueryClientAllInfoResponse | null>(null);
  const [jobs, setJobs] = useState<UserQueryClientJobsResponse['jobs']>([]);
  const [modules, setModules] = useState<UserModuleCatalogResponse['modules']>([]);
  const [selectedInstallModule, setSelectedInstallModule] = useState('');
  const [selectedRunModule, setSelectedRunModule] = useState('');
  const liveAlive = useLiveClientStore((state) =>
    clientInfo ? state.aliveByClientUuid[clientInfo.uuid] : undefined,
  );

  useEffect(() => {
    if (!clientUsername) {
      return;
    }

    let cancelled = false;

    const loadPage = async () => {
      const [infoResult, jobsResult, modulesResult] = await Promise.all([
        apiClient.get<UserQueryClientAllInfoResponse>(`/user/query/${clientUsername}/all-info`),
        apiClient.get<UserQueryClientJobsResponse>(`/user/query/${clientUsername}/jobs`),
        apiClient.get<UserModuleCatalogResponse>('/user/modules'),
      ]);

      if (cancelled) {
        return;
      }

      if (isApiError(infoResult)) {
        addError(infoResult);
      } else {
        setClientInfo(infoResult);
      }

      if (isApiError(jobsResult)) {
        addError(jobsResult);
      } else {
        setJobs(jobsResult.jobs);
      }

      if (isApiError(modulesResult)) {
        addError(modulesResult);
      } else {
        setModules(modulesResult.modules);
      }
    };

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [addError, clientUsername]);

  const reloadClientInfo = async () => {
    if (!clientUsername) {
      return;
    }

    const result = await apiClient.get<UserQueryClientAllInfoResponse>(
      `/user/query/${clientUsername}/all-info`,
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    setClientInfo(result);
  };

  const reloadJobs = async () => {
    if (!clientUsername) {
      return;
    }

    const result = await apiClient.get<UserQueryClientJobsResponse>(
      `/user/query/${clientUsername}/jobs`,
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    setJobs(result.jobs);
  };

  const installableModules = useMemo(() => {
    if (!clientInfo) {
      return [];
    }

    return modules.filter(
      (module) => module.inDatabase && !clientInfo.installedModules.includes(module.name),
    );
  }, [clientInfo, modules]);

  const runningModules = useMemo(() => clientInfo?.installedModules ?? [], [clientInfo]);

  const alive = clientInfo ? liveAlive ?? clientInfo.alive : false;

  const handleToggleBlock = async () => {
    if (!clientInfo) {
      return;
    }

    const action = clientInfo.blocked ? 'unblock' : 'block';
    const result = await apiClient.post<BasicTaskResponse, Record<string, never>>(
      `/user/modify/${clientInfo.username}/${action}`,
      {},
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    await reloadClientInfo();
  };

  const handleRevokeToken = async (refreshTokenUuid: string) => {
    const result = await apiClient.get<BasicTaskResponse>(
      `/user/revoke-refresh-token/${refreshTokenUuid}`,
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    await reloadClientInfo();
  };

  const handleInstallModule = async () => {
    if (!clientInfo || selectedInstallModule.length === 0) {
      return;
    }

    const result = await apiClient.post<BasicTaskResponse, { moduleName: string }>(
      `/user/modify/${clientInfo.username}/install-module`,
      { moduleName: selectedInstallModule },
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    setSelectedInstallModule('');
    await reloadClientInfo();
  };

  const handleRunModule = async () => {
    if (!clientInfo || selectedRunModule.length === 0) {
      return;
    }

    const result = await apiClient.post<BasicTaskResponse, UserRunModuleRequest>(
      `/user/run/${selectedRunModule}`,
      { clientUsername: clientInfo.username },
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    setSelectedRunModule('');
    await reloadJobs();
  };

  const handleStopJob = async (jobUuid: string) => {
    const result = await apiClient.post<BasicTaskResponse, Record<string, never>>(
      `/user/stop/${jobUuid}`,
      {},
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    await reloadJobs();
  };

  if (!clientInfo) {
    return (
      <div className="theme-surface p-8 text-sm text-slate-600">
        Loading client details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="theme-surface p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link className="theme-kicker" to="/clients">
              Clients
            </Link>
            <h2 className="theme-page-title mt-3">{clientInfo.username}</h2>
            <p className="theme-page-copy mt-3 max-w-2xl">
              Review identity, runtime state, refresh tokens, installed modules, and active
              jobs for this client.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={alive ? 'theme-badge-online' : 'theme-badge-offline'}>
              {alive ? 'Alive' : 'Offline'}
            </span>
            <button className="theme-button-secondary" onClick={handleToggleBlock}>
              {clientInfo.blocked ? 'Unblock client' : 'Block client'}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="theme-surface p-6">
          <p className="theme-kicker">Identity</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="theme-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Host</p>
              <p className="mt-2 text-sm text-sky-950">{clientInfo.hostname ?? 'N/A'}</p>
            </div>
            <div className="theme-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">IP</p>
              <p className="mt-2 text-sm text-sky-950">{clientInfo.ipAddress ?? 'N/A'}</p>
            </div>
            <div className="theme-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Platform</p>
              <p className="mt-2 text-sm capitalize text-sky-950">{clientInfo.platform}</p>
            </div>
            <div className="theme-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Version</p>
              <p className="mt-2 text-sm text-sky-950">{clientInfo.version}</p>
            </div>
            <div className="theme-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Last Seen</p>
              <p className="mt-2 text-sm text-sky-950">{formatDateTime(clientInfo.lastSeen)}</p>
            </div>
            <div className="theme-surface-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">Client UUID</p>
              <p className="mt-2 break-all text-sm text-sky-950">{clientInfo.uuid}</p>
            </div>
          </div>
        </div>

        <div className="theme-surface p-6">
          <p className="theme-kicker">Installed Modules</p>
          <div className="mt-4 space-y-2">
            {clientInfo.installedModules.length === 0 && (
              <p className="text-sm text-slate-600">No modules installed on this client.</p>
            )}
            {clientInfo.installedModules.map((moduleName) => (
              <div
                key={moduleName}
                className="theme-surface-soft flex items-center justify-between p-4 text-sm text-sky-950"
              >
                <span>{moduleName}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <label className="theme-kicker block">Install Module</label>
            <select
              className="theme-select"
              value={selectedInstallModule}
              onChange={(event) => setSelectedInstallModule(event.target.value)}
            >
              <option value="">Select a module</option>
              {installableModules.map((module) => (
                <option key={module.name} value={module.name}>
                  {module.name}
                </option>
              ))}
            </select>
            <button className="theme-button-primary" onClick={handleInstallModule}>
              Install on client
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="theme-surface p-6">
          <p className="theme-kicker">Execution</p>
          <div className="mt-5 space-y-3">
            <select
              className="theme-select"
              value={selectedRunModule}
              onChange={(event) => setSelectedRunModule(event.target.value)}
            >
              <option value="">Select an installed module</option>
              {runningModules.map((moduleName) => (
                <option key={moduleName} value={moduleName}>
                  {moduleName}
                </option>
              ))}
            </select>
            <button className="theme-button-primary" onClick={handleRunModule}>
              Run module
            </button>
          </div>
          <div className="mt-6 space-y-3">
            {jobs.length === 0 && (
              <p className="text-sm text-slate-600">No active jobs for this client.</p>
            )}
            {jobs.map((job) => (
              <div
                key={job.jobUuid}
                className="theme-surface-soft flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-sky-950">{job.moduleName}</p>
                  <p className="mt-1 text-xs text-slate-500">{job.jobUuid}</p>
                </div>
                <button
                  className="theme-button-secondary"
                  onClick={() => handleStopJob(job.jobUuid)}
                >
                  Stop job
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="theme-surface p-6">
          <p className="theme-kicker">Refresh Tokens</p>
          <div className="mt-5 space-y-3">
            {clientInfo.refreshTokens.length === 0 && (
              <p className="text-sm text-slate-600">No refresh tokens were issued for this client.</p>
            )}
            {clientInfo.refreshTokens.map((token) => (
              <div
                key={token.uuid}
                className="theme-surface-soft flex flex-col gap-3 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-sky-950">{token.uuid}</span>
                  {!token.revoked && (
                    <button
                      className="theme-button-secondary"
                      onClick={() => handleRevokeToken(token.uuid)}
                    >
                      Revoke
                    </button>
                  )}
                </div>
                <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <p>Created: {formatDateTime(token.createdAt)}</p>
                  <p>Expires: {formatDateTime(token.expiresAt)}</p>
                  <p>Status: {token.revoked ? 'Revoked' : 'Active'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
