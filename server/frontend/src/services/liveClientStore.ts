import { create } from 'zustand';

type LiveClientState = {
  aliveByClientUuid: Record<string, boolean>;
  setClientAlive: (clientUuid: string, alive: boolean) => void;
  clear: () => void;
};

export const useLiveClientStore = create<LiveClientState>((set) => ({
  aliveByClientUuid: {},
  setClientAlive: (clientUuid, alive) =>
    set((state) => ({
      aliveByClientUuid: {
        ...state.aliveByClientUuid,
        [clientUuid]: alive,
      },
    })),
  clear: () => set({ aliveByClientUuid: {} }),
}));
