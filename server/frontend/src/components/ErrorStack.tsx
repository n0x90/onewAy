import { useErrorStore } from '../services/errorStore';

export default function ErrorStack() {
  const errors = useErrorStore((state) => state.errors);
  const removeError = useErrorStore((state) => state.removeError);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-6 top-6 z-50 w-full max-w-md space-y-3">
      {errors.map((error) => (
        <div
          key={error.id}
          className="theme-surface border-red-200/70 bg-red-50/95 px-4 py-3 text-sm text-red-700"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{error.message}</p>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500 transition hover:text-red-700"
              onClick={() => removeError(error.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
