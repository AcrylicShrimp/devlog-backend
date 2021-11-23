import { Injectable } from '@nestjs/common';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';

export type FetchType = (
	url: RequestInfo,
	init?: RequestInit
) => Promise<Response>;

@Injectable()
export class ViewSSRFetchService {
	constructor(private fetchImpl: FetchType) {}

	get fetch(): FetchType {
		return this.fetchImpl;
	}
}
