import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ErrorRequestHandler } from 'express';

let sentryErrorHandler: ErrorRequestHandler | null = null;

if (process.env.SENTRY_DSN) sentryErrorHandler = Sentry.Handlers.errorHandler();

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost) {
		if (sentryErrorHandler) {
			const http = host.switchToHttp();

			sentryErrorHandler(
				exception,
				http.getRequest(),
				http.getResponse(),
				http.getNext()
			);
		}

		throw exception;
	}
}
