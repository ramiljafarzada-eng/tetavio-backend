import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorResponseBody {
  success: false;
  message: string;
  errors?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errors: unknown;

    if (isHttpException) {
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        const normalized = errorResponse as {
          message?: string | string[];
          error?: string;
          errors?: unknown;
        };

        if (Array.isArray(normalized.message)) {
          message = 'Validation failed';
          errors = normalized.message;
        } else if (typeof normalized.message === 'string') {
          message = normalized.message;
        } else if (typeof normalized.error === 'string') {
          message = normalized.error;
        }

        if (normalized.errors !== undefined) {
          errors = normalized.errors;
        }
      }
    }

    const body: ErrorResponseBody = {
      success: false,
      message,
      ...(errors !== undefined ? { errors } : {}),
    };

    response.status(status).json(body);
  }
}
