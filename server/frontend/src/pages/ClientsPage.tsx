import { useEffect, useMemo, useState } from 'react';
import ClientCard from '../components/ClientCard';
import type { UserAllClientsResponse } from '../schemas/user';
import { apiClient, isApiError } from '../services/apiClient';
import { useErrorStore } from '../services/errorStore';

export default function ClientsPage() {
  const [clientUsernames, setClientUsernames] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const addError = useErrorStore((state) => state.addError);

  useEffect(() => {
    let cancelled = false;

    const loadClients = async () => {
      const response = await apiClient.get<UserAllClientsResponse>('/user/all-clients');
      if (cancelled) {
        return;
      }

      if (isApiError(response)) {
        addError(response);
        return;
      }

      setClientUsernames(response.allClients);
    };

    void loadClients();

    return () => {
      cancelled = true;
    };
  }, [addError]);

  const filteredClients = useMemo(
    () =>
      clientUsernames.filter((username) =>
        username.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [clientUsernames, search],
  );

  return (
    <div className="space-y-6">
      <section className="theme-surface p-8">
        <p className="theme-kicker">Clients</p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="theme-page-title">Client fleet</h2>
            <p className="theme-page-copy mt-3 max-w-2xl">
              Browse all registered clients, inspect live status, and jump into per-client
              management pages.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <label className="theme-kicker mb-2 block">Search</label>
            <input
              className="theme-input"
              placeholder="Filter by username"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredClients.map((username) => (
          <ClientCard
            key={username}
            detailHref={`/clients/${username}`}
            username={username}
          />
        ))}
        {filteredClients.length === 0 && (
          <div className="theme-surface p-6 text-sm text-slate-600">
            No clients matched the current filter.
          </div>
        )}
      </section>
    </div>
  );
}
