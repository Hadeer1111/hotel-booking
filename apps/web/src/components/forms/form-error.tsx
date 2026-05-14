'use client';

import { isApiError } from '@/lib/api/api-error';

export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  const message =
    isApiError(error) ? error.problem.detail ?? error.problem.title : error instanceof Error ? error.message : 'Something went wrong';
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  );
}
