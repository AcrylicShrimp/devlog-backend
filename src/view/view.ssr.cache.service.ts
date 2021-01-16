import { Injectable } from '@nestjs/common';

@Injectable()
export class ViewSSRCacheService {
	private caches = new Map<string, [number, string]>();
	private cacheExpiry = Number(
		process.env.SSR_CACHE_EXPIRY || 1000 * 60 * 60 * 24 * 7
	);

	purge(): void {
		this.caches = new Map<string, [number, string]>();
	}

	get(path: string): string | null {
		const cache = this.caches.get(path);

		if (!cache) return null;

		const [time, data] = cache;

		if (this.cacheExpiry <= Date.now() - time) {
			this.caches.delete(path);
			return null;
		}

		return data;
	}

	set(path: string, data: string): void {
		this.caches.set(path, [Date.now(), data]);
	}
}
