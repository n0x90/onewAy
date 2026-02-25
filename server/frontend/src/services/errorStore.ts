import { create } from 'zustand';
import type { ApiError } from './apiClient';

export const Severity = {
  Debug: 'debug',
  Warning: 'warning',
  Error: 'error',
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export interface AppError {
  id: string;
  severity: Severity;
  message: string;
}

type AddErrorInput = Omit<AppError, 'id'> | ApiError;

const isApiError = (err: AddErrorInput): err is ApiError => {
  return (
    'statusCode' in err &&
    typeof err.statusCode === 'number' &&
    'detail' in err &&
    typeof err.detail === 'string'
  );
};

type ErrorState = {
  errors: AppError[];
  addError: (err: AddErrorInput) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
};

export const useErrorStore = create<ErrorState>((set) => ({
  errors: [],
  addError: (err) => {
    const normalizedError: Omit<AppError, 'id'> = isApiError(err)
      ? {
        severity: Severity.Error,
        message: err.detail,
      }
      : err;

    return set((state) => ({
      errors: [...state.errors, { ...normalizedError, id: crypto.randomUUID() }],
    }));
  },
  removeError: (id) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    })),
  clearErrors: () => set({ errors: [] }),
}));
