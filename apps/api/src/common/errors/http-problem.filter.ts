import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

/**
 * RFC 7807 Problem Details envelope used for every error response.
 *
 * https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
  code?: string;
  errors?: { path: (string | number)[]; message: string }[];
}

@Catch()
export class HttpProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpProblemFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const problem = this.toProblem(exception, req);

    if (problem.status >= 500) {
      this.logger.error(`${req.method} ${req.url} -> ${problem.status}`, exception);
    }

    res
      .status(problem.status)
      .type('application/problem+json')
      .json(problem);
  }

  private toProblem(exception: unknown, req: Request): ProblemDetails {
    const instance = req.originalUrl ?? req.url ?? '';

    if (exception instanceof ZodError) {
      return {
        type: 'https://hotel-booking.dev/errors/validation',
        title: 'Validation Failed',
        status: HttpStatus.BAD_REQUEST,
        detail: 'one or more fields are invalid',
        code: 'VALIDATION_ERROR',
        instance,
        errors: exception.issues.map((i) => ({ path: i.path, message: i.message })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resBody = exception.getResponse();
      const detail = typeof resBody === 'string' ? resBody : (resBody as { message?: string }).message;
      const code = typeof resBody === 'object' ? (resBody as { code?: string }).code : undefined;
      return {
        type: `https://hotel-booking.dev/errors/${status}`,
        title: exception.message,
        status,
        detail: typeof detail === 'string' ? detail : exception.message,
        code,
        instance,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception);
      return { ...mapped, instance };
    }

    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred',
      instance,
    };
  }
}

function mapPrismaError(
  err: Prisma.PrismaClientKnownRequestError,
): Omit<ProblemDetails, 'instance'> {
  switch (err.code) {
    case 'P2002': // unique violation
      return {
        type: 'https://hotel-booking.dev/errors/conflict',
        title: 'Conflict',
        status: HttpStatus.CONFLICT,
        detail: 'a resource with the given unique value already exists',
        code: 'UNIQUE_VIOLATION',
      };
    case 'P2025': // record not found
      return {
        type: 'https://hotel-booking.dev/errors/not-found',
        title: 'Not Found',
        status: HttpStatus.NOT_FOUND,
        detail: 'resource not found',
        code: 'NOT_FOUND',
      };
    default:
      return {
        type: 'about:blank',
        title: 'Database Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        detail: err.message,
        code: err.code,
      };
  }
}
