import { useEffect, useState } from 'react';
import { apiClient, isApiError } from '../services/apiClient';
import type { UserQueryClientBasicInfoResponse } from '../schemas/user';
import { useErrorStore } from '../services/errorStore';

interface ClientCardProps {
  username: string;
}

export default function ClientCard({ username }: ClientCardProps) {
  const [clientBasicInfo, setClientBasicInfo] =
    useState<UserQueryClientBasicInfoResponse | null>(null);
  const addError = useErrorStore((state) => state.addError);

  useEffect(() => {
    const queryClientBasicInfo = async () => {
      const response = await apiClient.get<UserQueryClientBasicInfoResponse>(
        `/user/query/${username}/basic-info`,
      );
      if (isApiError(response)) {
        addError(response);
      } else {
        setClientBasicInfo(response);
      }
    };

    void queryClientBasicInfo();
  }, [addError, username]);

  if (!clientBasicInfo) {
    return (
      <article className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Loading client `{username}`...</p>
      </article>
    );
  }

  return (
    <article className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">{clientBasicInfo.username}</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            clientBasicInfo.alive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {clientBasicInfo.alive ? 'Alive' : 'Offline'}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
        <p>
          <span className="font-medium text-slate-900">IP:</span>{' '}
          {clientBasicInfo.ipAddress === 'None' ? 'N/A' : clientBasicInfo.ipAddress ?? 'N/A'}
        </p>
        <p>
          <span className="font-medium text-slate-900">Host:</span>{' '}
          {clientBasicInfo.hostname ?? 'N/A'}
        </p>
        <p>
          <span className="font-medium text-slate-900">Platform:</span>{' '}
          {clientBasicInfo.platform.charAt(0).toUpperCase() + clientBasicInfo.platform.slice(1)}
        </p>
      </div>
    </article>
  );
}
