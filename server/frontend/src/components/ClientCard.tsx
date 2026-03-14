import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, isApiError } from '../services/apiClient';
import { useLiveClientStore } from '../services/liveClientStore';
import type { UserQueryClientBasicInfoResponse } from '../schemas/user';
import { useErrorStore } from '../services/errorStore';

interface ClientCardProps {
  detailHref?: string;
  initialData?: UserQueryClientBasicInfoResponse;
  username: string;
}

export default function ClientCard({ detailHref, initialData, username }: ClientCardProps) {
  const [clientBasicInfo, setClientBasicInfo] =
    useState<UserQueryClientBasicInfoResponse | null>(initialData ?? null);
  const addError = useErrorStore((state) => state.addError);
  const liveAlive = useLiveClientStore((state) =>
    clientBasicInfo ? state.aliveByClientUuid[clientBasicInfo.uuid] : undefined,
  );

  useEffect(() => {
    if (initialData) {
      return;
    }

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
  }, [addError, initialData, username]);

  if (!clientBasicInfo) {
    return (
      <article className="theme-surface w-full p-5">
        <p className="text-sm text-slate-500">Loading client `{username}`...</p>
      </article>
    );
  }

  const alive = liveAlive ?? clientBasicInfo.alive;

  return (
    <article className="theme-surface w-full p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="theme-kicker">Client</p>
          <h3 className="text-lg font-semibold text-sky-950">{clientBasicInfo.username}</h3>
        </div>
        <span className={alive ? 'theme-badge-online' : 'theme-badge-offline'}>
          {alive ? 'Alive' : 'Offline'}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3">
        <p>
          <span className="font-medium text-slate-900">IP:</span>{' '}
          {clientBasicInfo.ipAddress ?? 'N/A'}
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
      {detailHref && (
        <div className="mt-5 flex justify-end">
          <Link className="theme-button-secondary" to={detailHref}>
            Open Client
          </Link>
        </div>
      )}
    </article>
  );
}
