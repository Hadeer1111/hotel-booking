import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
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
    errors?: {
        path: (string | number)[];
        message: string;
    }[];
}
export declare class HttpProblemFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
    private toProblem;
}
