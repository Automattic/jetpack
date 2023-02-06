import type { Readable, Writable } from 'svelte/store';
import type { z } from 'zod';

/**
 * A Svelte store that's going to automatically sync with the API.
 */
export type SyncedStoreInterface< T > = {
	store: SyncedWritable< T >;
	pending: Readable< boolean >;
};

/**
 * A syncable value with a nonce that's validated by Zod.
 */
export type ValidatedValue< T extends z.ZodSchema > = {
	value: z.infer< T >;
	nonce: string;
};

/**
 * A custom Svelte store that's used to indicate if a value is being synced.
 */
export interface Pending {
	subscribe: Readable< boolean >[ 'subscribe' ];
	stop: () => void;
	start: () => void;
}

/**
 * Callback to perform after a SyncedStore value is updated.
 * This is typically a POST request to the corresponding API endpoint.
 * But can be changed to any function that returns a Promise.
 */
export type SyncedStoreCallback< T > = ( value: T ) => Promise< T >;

/**
 * A writable Svelte store that's going to automatically sync with the API.
 * Also includes an `override` method that can be used to set the value without syncing.
 */
export type SyncedWritable< T > = Writable< T > & {
	override: ( value: T ) => void;
};
