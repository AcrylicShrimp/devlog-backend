// Type definitions for Formidable 1.0.16
// Project: https://github.com/felixge/node-formidable/
// Definitions by: Wim Looman <https://github.com/Nemo157>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference types="node" />

declare module 'formidable' {
	import http = require('http');
	import stream = require('stream');
	import events = require('events');

	export class IncomingForm extends events.EventEmitter {
		constructor(options?: ConstructorOptions);

		encoding: string;
		uploadDir: string;
		keepExtensions: boolean;
		maxFileSize: number;
		maxFieldsSize: number;
		maxFields: number;
		hash: string | boolean;
		multiples: boolean;
		type: string;
		bytesReceived: number;
		bytesExpected: number;

		onPart: (part: Part) => void;

		handlePart(part: Part): void;
		parse(
			req: http.IncomingMessage,
			callback?: (err: any, fields: Fields, files: Files) => any
		): void;
	}

	export interface ConstructorOptions {
		maxFileSize?: number;
		maxFields?: number;
		multiples?: boolean;
	}

	export interface Fields {
		[key: string]: string | Array<string>;
	}

	export interface Files {
		[key: string]: File | File[];
	}

	export interface Part extends stream.Stream {
		headers: { [key: string]: string };
		name: string;
		filename?: string;
		mime?: string;
	}

	export interface File {
		size: number;
		path: string;
		name: string;
		type: string;
		lastModifiedDate?: Date;
		hash?: string;

		toJSON(): Record<string, unknown>;
	}
}
