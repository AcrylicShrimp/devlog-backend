type Not<T> = [T] extends [never] ? unknown : never;
type Extractable<T, U> = Not<
	U extends any ? Not<T extends U ? unknown : never> : never
>;

export function asEnum<
	E extends Record<keyof E, string | number>,
	K extends string | number
>(e: E, k: K & Extractable<E[keyof E], K>): Extract<E[keyof E], K> {
	if (0 <= Object.values(e).indexOf(k)) return k as any;

	throw new Error(`expected one of ${Object.values(e).join(', ')}`);
}

export function isEnum<
	E extends Record<keyof E, string | number>,
	K extends string | number
>(e: E, k: K & Extractable<E[keyof E], K>): boolean {
	return 0 <= Object.values(e).indexOf(k);
}
