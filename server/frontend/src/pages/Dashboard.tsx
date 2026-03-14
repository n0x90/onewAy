import { useEffect, useState } from 'react';
import ClientCard from '../components/ClientCard';
import type {
  UserAllClientsResponse,
  UserQueryClientBasicInfoResponse,
} from '../schemas/user';
import { apiClient, isApiError } from '../services/apiClient';
import { useErrorStore } from '../services/errorStore';
import { useLiveClientStore } from '../services/liveClientStore';

export default function Dashboard() {
  const [clientDetails, setClientDetails] = useState<UserQueryClientBasicInfoResponse[]>([]);
  const addError = useErrorStore((state) => state.addError);
  const liveStatuses = useLiveClientStore((state) => state.aliveByClientUuid);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      const clientsResult = await apiClient.get<UserAllClientsResponse>('/user/all-clients');
      if (isApiError(clientsResult)) {
        addError(clientsResult);
        return;
      }

      const detailResults = await Promise.all(
        clientsResult.allClients.map((username) =>
          apiClient.get<UserQueryClientBasicInfoResponse>(
            `/user/query/${username}/basic-info`,
          ),
        ),
      );

      if (cancelled) {
        return;
      }

      const details: UserQueryClientBasicInfoResponse[] = [];
      for (const result of detailResults) {
        if (isApiError(result)) {
          addError(result);
        } else {
          details.push(result);
        }
      }

      setClientDetails(details);
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [addError]);

  const onlineCount = clientDetails.filter(
    (client) => liveStatuses[client.uuid] ?? client.alive,
  ).length;
  const offlineCount = clientDetails.length - onlineCount;
  const recentClients = clientDetails.slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="theme-surface-soft p-5">
          <p className="theme-kicker">Clients</p>
          <p className="mt-3 text-3xl font-semibold text-sky-950">{clientDetails.length}</p>
        </div>
        <div className="theme-surface-soft p-5">
          <p className="theme-kicker">Online</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-600">{onlineCount}</p>
        </div>
        <div className="theme-surface-soft p-5">
          <p className="theme-kicker">Offline</p>
          <p className="mt-3 text-3xl font-semibold text-slate-500">{offlineCount}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-sky-950">Recent clients</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {recentClients.map((client) => (
            <ClientCard
              key={client.uuid}
              detailHref={`/clients/${client.username}`}
              initialData={client}
              username={client.username}
            />
          ))}
          {recentClients.length === 0 && (
            <div className="theme-surface p-6 text-sm text-slate-600">
              No clients are registered yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
