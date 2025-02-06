import type { Writable } from 'svelte/store';

export namespace AsyncOptions {
	export interface Options {
		[ key: string ]: {
			value: unknown;
			nonce: string;
		};
	}

	export interface PendingStore {
		subscribe: Writable< boolean >[ 'subscribe' ];
		stop: () => void;
		start: () => void;
	}

	export interface OptionStore< T > {
		value: Writable< T >;
		pending: PendingStore;
	}
}
