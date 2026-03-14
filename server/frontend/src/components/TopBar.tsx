type TopBarProps = {
  loggingOut: boolean;
  onLogout: () => void;
  username: string | null;
};

export default function TopBar({ loggingOut, onLogout, username }: TopBarProps) {
  return (
    <header className="theme-topbar sticky top-0 z-30 h-16 px-6">
      <div className="flex h-full items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-wide text-sky-950">onewAy</h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm font-medium text-sky-900 sm:block">
            {username ?? 'Loading user'}
          </p>
          <button
            type="button"
            className="theme-button-secondary"
            disabled={loggingOut}
            onClick={onLogout}
          >
            {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  );
}
