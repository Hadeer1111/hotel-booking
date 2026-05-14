import type { ProblemDetails } from '@hotel-booking/types';

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.status = problem.status;
    this.problem = problem;
  }

  get code(): string | undefined {
    return this.problem.code;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
