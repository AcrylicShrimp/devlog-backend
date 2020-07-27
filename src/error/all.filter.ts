import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ErrorRequestHandler, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
	constructor(private sentryErrorHandler: ErrorRequestHandler | null = null) {
		if (process.env.SENTRY_DSN)
			sentryErrorHandler = Sentry.Handlers.errorHandler();
	}

	catch(error: Error, host: ArgumentsHost) {
		const http = host.switchToHttp();

		if (this.sentryErrorHandler)
			this.sentryErrorHandler(
				error,
				http.getRequest(),
				http.getResponse(),
				http.getNext()
			);

		http.getResponse<Response>()
			.status(
				error instanceof HttpException
					? error.getStatus()
					: HttpStatus.INTERNAL_SERVER_ERROR
			)
			.end();

		throw error;
	}
}
