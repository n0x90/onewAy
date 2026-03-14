import { useEffect, useMemo, useState } from 'react';
import type { BasicTaskResponse } from '../schemas/general';
import type {
  UserMetasploitAdvancedOptionsModResponse,
  UserMetasploitJobsResponse,
  UserMetasploitModulesResponse,
  UserMetasploitOptionsModResponse,
  UserMetasploitRunModRequest,
  UserMetasploitRunModResponse,
} from '../schemas/user';
import { apiClient, isApiError } from '../services/apiClient';
import { useErrorStore } from '../services/errorStore';

type OptionMap = Record<string, string>;

export default function MetasploitPage() {
  const addError = useErrorStore((state) => state.addError);
  const [modules, setModules] = useState<string[]>([]);
  const [jobs, setJobs] = useState<UserMetasploitJobsResponse['jobs']>([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [moduleOptions, setModuleOptions] = useState<OptionMap>({});
  const [advancedOptions, setAdvancedOptions] = useState<OptionMap>({});
  const [runOptions, setRunOptions] = useState<OptionMap>({});
  const [search, setSearch] = useState('');

  const loadJobs = async () => {
    const result = await apiClient.get<UserMetasploitJobsResponse>('/user/metasploit/jobs');
    if (isApiError(result)) {
      addError(result);
      return;
    }

    setJobs(result.jobs);
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrapPage = async () => {
      const [modulesResult, jobsResult] = await Promise.all([
        apiClient.get<UserMetasploitModulesResponse>('/user/metasploit/modules'),
        apiClient.get<UserMetasploitJobsResponse>('/user/metasploit/jobs'),
      ]);

      if (cancelled) {
        return;
      }

      if (isApiError(modulesResult)) {
        addError(modulesResult);
      } else {
        setModules(modulesResult.modules);
      }

      if (isApiError(jobsResult)) {
        addError(jobsResult);
      } else {
        setJobs(jobsResult.jobs);
      }
    };

    void bootstrapPage();

    return () => {
      cancelled = true;
    };
  }, [addError]);

  useEffect(() => {
    if (!selectedModule) {
      return;
    }

    let cancelled = false;

    const loadOptions = async () => {
      const [optionsResult, advancedResult] = await Promise.all([
        apiClient.get<UserMetasploitOptionsModResponse>(
          `/user/metasploit/options/${encodeURIComponent(selectedModule)}`,
        ),
        apiClient.get<UserMetasploitAdvancedOptionsModResponse>(
          `/user/metasploit/advanced-options/${encodeURIComponent(selectedModule)}`,
        ),
      ]);

      if (cancelled) {
        return;
      }

      if (isApiError(optionsResult)) {
        addError(optionsResult);
        return;
      }

      if (isApiError(advancedResult)) {
        addError(advancedResult);
        return;
      }

      const nextOptions = optionsResult.data[selectedModule] ?? {};
      const nextAdvanced = advancedResult.data[selectedModule] ?? {};

      setModuleOptions(nextOptions);
      setAdvancedOptions(nextAdvanced);
      setRunOptions({ ...nextOptions, ...nextAdvanced });
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [addError, selectedModule]);

  const filteredModules = useMemo(
    () =>
      modules.filter((moduleName) =>
        moduleName.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [modules, search],
  );

  const handleRun = async () => {
    if (!selectedModule) {
      return;
    }

    const payload: UserMetasploitRunModRequest = {
      opts: Object.fromEntries(
        Object.entries(runOptions).filter(([, value]) => value.trim().length > 0),
      ),
    };

    const result = await apiClient.post<UserMetasploitRunModResponse, UserMetasploitRunModRequest>(
      `/user/metasploit/run/${encodeURIComponent(selectedModule)}`,
      payload,
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    await loadJobs();
  };

  const handleStopJob = async (jobId: string) => {
    const result = await apiClient.post<BasicTaskResponse, Record<string, never>>(
      `/user/metasploit/stop/${jobId}`,
      {},
    );
    if (isApiError(result)) {
      addError(result);
      return;
    }

    await loadJobs();
  };

  return (
    <div className="space-y-6">
      <section className="theme-surface p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="theme-kicker">Metasploit Add-On</p>
            <h2 className="theme-page-title mt-3">Metasploit modules</h2>
            <p className="theme-page-copy mt-3 max-w-2xl">
              Browse Metasploit RPC modules, inspect options, launch jobs, and stop active jobs
              without mixing them into the standard module catalog.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <label className="theme-kicker mb-2 block">Search</label>
            <input
              className="theme-input"
              placeholder="Filter module names"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="theme-surface p-6">
          <p className="theme-kicker">Available Modules</p>
          <div className="mt-4 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
            {filteredModules.map((moduleName) => (
              <button
                key={moduleName}
                type="button"
                className={
                  selectedModule === moduleName
                    ? 'theme-button-primary w-full justify-start'
                    : 'theme-button-secondary w-full justify-start'
                }
                onClick={() => setSelectedModule(moduleName)}
              >
                {moduleName}
              </button>
            ))}
            {filteredModules.length === 0 && (
              <p className="text-sm text-slate-600">No Metasploit modules matched the filter.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="theme-surface p-6">
            <p className="theme-kicker">Run Module</p>
            <h3 className="mt-2 text-xl font-semibold text-sky-950">
              {selectedModule || 'Select a module'}
            </h3>
            {selectedModule && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="theme-surface-soft p-4 text-sm text-slate-700">
                  <p className="theme-kicker">Standard Options</p>
                  <p className="mt-2">{Object.keys(moduleOptions).length}</p>
                </div>
                <div className="theme-surface-soft p-4 text-sm text-slate-700">
                  <p className="theme-kicker">Advanced Options</p>
                  <p className="mt-2">{Object.keys(advancedOptions).length}</p>
                </div>
              </div>
            )}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {Object.entries(runOptions).map(([key, value]) => (
                <label key={key} className="block">
                  <span className="theme-kicker mb-2 block">{key}</span>
                  <input
                    className="theme-input"
                    value={value}
                    onChange={(event) =>
                      setRunOptions((state) => ({
                        ...state,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
              {selectedModule && Object.keys(runOptions).length === 0 && (
                <p className="text-sm text-slate-600">This module does not expose editable options.</p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="theme-button-primary"
                disabled={!selectedModule}
                onClick={handleRun}
              >
                Run Metasploit module
              </button>
            </div>
          </section>

          <section className="theme-surface p-6">
            <p className="theme-kicker">Active Jobs</p>
            <div className="mt-4 space-y-3">
              {jobs.length === 0 && (
                <p className="text-sm text-slate-600">No Metasploit jobs are active.</p>
              )}
              {jobs.map((job) => (
                <div
                  key={job.jobId}
                  className="theme-surface-soft flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-sky-950">{job.jobId}</p>
                    <p className="mt-1 text-xs text-slate-500">{job.description}</p>
                  </div>
                  <button
                    className="theme-button-secondary"
                    onClick={() => handleStopJob(job.jobId)}
                  >
                    Stop job
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
