import { useEffect, useState } from 'react';
import ClientCard from '../components/ClientCard';
import MainSkeleton from '../components/MainSkeleton';
import type { UserAllClientsResponse } from '../schemas/user';
import { apiClient, isApiError } from '../services/apiClient';
import { useErrorStore } from '../services/errorStore';

export default function Dashboard() {
  const [clientUsernames, setClientUsernames] = useState<string[]>([]);
  const addError = useErrorStore((state) => state.addError);

  useEffect(() => {
    const fetchAllClients = async () => {
      const response = await apiClient.get<UserAllClientsResponse>('/user/all-clients');
      if (isApiError(response)) {
        addError(response);
        return;
      }

      setClientUsernames(response.allClients);
    };

    void fetchAllClients();
  }, [addError]);

  return (
    <MainSkeleton>
      <div className="space-y-4">
        {clientUsernames.map((username) => (
          <ClientCard key={username} username={username} />
        ))}
      </div>
    </MainSkeleton>
  );
}
