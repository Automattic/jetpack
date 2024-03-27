import { Writable, writable } from 'svelte/store';
import { ApiError } from './ApiError.js';
import {
	Pending,
	SyncedStoreInterface,
	SyncedWritable,
	SyncedStoreCallback,
	SyncedStoreError,
} from './types.js';
import { sleep } from './utils.js';

/*
 * A custom Svelte Store that's used to indicate if a value is being synced.
 */
export class SyncedStore< T > {
	private store: SyncedWritable< T >;
	private errorStore: Writable< SyncedStoreError< T >[] >;
	private pending: Pending;
	private syncAction?: SyncedStoreCallback< T >;
	private abortController: AbortController;

	constructor( initialValue?: T ) {
		this.store = this.createStore( initialValue );
		this.errorStore = writable< SyncedStoreError< T >[] >( [] );
		this.pending = this.createPendingStore();
	}

	private isPrimitive( value: T ): boolean {
		return (
			typeof value === 'string' ||
			typeof value === 'number' ||
			typeof value === 'boolean' ||
			value === null ||
			value === undefined
		);
	}

	/**
	 * Deep clone a JSON-compatible value. Uses structuredClone if available, otherwise uses JSON.parse.
	 */
	private clone( value: T ): T {
		if ( typeof structuredClone === 'function' ) {
			return structuredClone( value );
		}

		return JSON.parse( JSON.stringify( value ) );
	}

	private createStore( initialValue?: T ): SyncedWritable< T > {
		const store = writable< T >( initialValue );

		// Track the previous value.
		// This is used to determine if the value has changed.
		// If the value has not changed, then the store should not be synchronized.
		const isPrimitive = this.isPrimitive( initialValue );
		let prevValue: T;
		store.subscribe( value => {
			// structuredClone may be necessary because using `set` in Svelte will mutate objects.
			// By the time the value gets to SyncedStore methods it's already mutated,
			// and so the previous value will be the same as the current value.
			prevValue = isPrimitive ? value : this.clone( value );
		} );

		// `set` is a required method in the Writable interface.
		// It is called when value is modified using the `store.set` method or `$store = value`.
		// Set the store value and synchronize it with the API.
		const set = value => {
			// Synchronize is called without await here. This is intentional!
			// This way the store can be updated immediately without waiting for the API.
			this.abortableSynchronize( prevValue, value );

			/**
			 * ⚠️ EDGE CASE: Delay object updating until the next microtask. ⚠️
			 * --
			 * ## Background:
			 * SyncedStore is a wrapper around Svelte's writable store.
			 * The writable store will attempt to synchronize the value asynchronously with WordPress.
			 * `abortableSynchronize` (or custom callback actions) can compare the values to
			 * reduce requests issued to the API.
			 *
			 * ## The Problem
			 * In Svelte.js, whenever you call `$store.objectProperty = value`,
			 * it's going to immediately update the store value and trigger `.subscribe()` callbacks.
			 *
			 * If two properties in an object are updated one after the other, they'll trigger
			 * multiple store updates. This means that `prevValue` is going to change twice,
			 * and by the time `abortableSynchronize` runs, some of the properties that have changes
			 * will actually appear unchanged in the callback.
			 *
			 * For example:
			 * ```ts
			 * $store = writable({ a: 1, b: 2, c: 3 });
			 * $store.a = 10;
			 * $store.b = 20;
			 * ```
			 *
			 * `abortableSynchronize` is asynchronous and it debounces itself, so it will receive:
			 * ```ts
			 * prevValue = { a: 10, b: 2, c: 3 };
			 * value = { a: 10, b: 20, c: 3 };
			 * ```
			 * Note the value of `$store.a`: by the time `abortableSynchronize` runs, it's already 10
			 * and so determining if the value has changed is impossible.
			 *
			 * ## The Solution
			 * To solve this, we can delay updating the actual value of the store until the next microtask,
			 * that way giving time for both `$store.a` and `$store.b` to be updated.
			 * Before setting the actual value of the store.
			 *
			 * ## Side Quest (Optional)
			 * If you're looking at this closely, you might be wondering - this is just delaying when the store is set!
			 * This will still cause `store.set` to be called twice with the same value, right?
			 *
			 * Yes, it will. But that's okay.
			 * Svelte isn't going to trigger the reactive callbacks twice, if the value
			 * is unchanged between `$store.set()` calls.
			 */
			// Since we already have `isPrimitive` available, there's no point debouncing primitive value changes.
			if ( isPrimitive ) {
				store.set( value );
			} else {
				// @see https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask
				queueMicrotask( () => {
					store.set( value );
				} );
			}
		};

		// Update is an useful utility function in Svelte for updating a value
		// based on the previous value. This is here only because SyncedStore
		// aims to have full parity with Svelte's writable store.
		type SvelteUpdater = typeof store.update;
		const update: SvelteUpdater = updateCallback => {
			// structuredClone is necessary here,
			// because the updateCallback can mutate the value,
			// and that's going to fail the comparison in `abortableSynchronize`.
			set( updateCallback( this.clone( prevValue ) ) );
		};

		return {
			subscribe: store.subscribe,
			set,
			update,
			override: store.set,
		};
	}

	/**
	 * A callback that will synchronize the store in some way.
	 * By default, this is set to endpoint.SET in the client initializer
	 */
	private setSyncAction( callback: SyncedStoreCallback< T > ) {
		this.syncAction = callback;
	}

	/**
	 * Attempt to synchronize the store with the API.
	 */
	private async synchronize( prevValue: T, value: T ): Promise< T | ApiError > {
		if ( ! this.syncAction ) {
			return value;
		}

		try {
			return await this.syncAction( prevValue, value, this.abortController.signal );
		} catch ( error ) {
			if ( error instanceof ApiError || error.name === 'ApiError' ) {
				return error as ApiError;
			}

			// Rethrow the error if it's not an ApiError.
			throw error;
		}
	}

	/**
	 * A debounced version of synchronize.
	 * This is used to prevent the API from being spammed with requests.
	 * It also prevents the store from updating when the API returns an error.
	 */
	private async abortableSynchronize( prevValue: T, value: T, retry = 0 ) {
		if ( this.abortController ) {
			this.abortController.abort();
		}

		// Pending value should only be used to indicate whether the store is currently syncing visually.
		// It should not be used to prevent the store from updating.
		// Given that, it's safe to start pending early.
		if ( retry === 0 ) {
			this.pending.start();
		}
		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		await sleep( 200 + 600 * retry );
		if ( signal.aborted ) {
			return;
		}

		const result = await this.synchronize( prevValue, value );

		if ( signal.aborted ) {
			return;
		}

		if ( result instanceof ApiError ) {
			if ( retry < 3 ) {
				// Wait a second before retrying.
				await sleep( 1000 );
				if ( signal.aborted ) {
					return;
				}
				this.abortableSynchronize( prevValue, value, retry + 1 );
				return;
			}
			this.errorStore.update( errors => {
				errors.push( {
					time: Date.now(),
					previousValue: prevValue,
					value,
					location: result.location,
					status: result.status,
					message: result.message,
				} );
				return errors;
			} );
			this.store.override( prevValue );
		}
		// After the request has successfully completed
		// Or it has failed enough times to give up
		// release the pending lock.
		this.pending.stop();

		return result;
	}

	private createPendingStore(): Pending {
		const { set, subscribe } = writable( false );
		return {
			subscribe,
			stop: () => set( false ),
			start: () => set( true ),
		};
	}

	/**
	 * All of the class methods in this class are private.
	 * Use this method to get the public interface of this class,
	 * exposing as little as possible.
	 */
	public getPublicInterface(): SyncedStoreInterface< T > {
		return {
			store: this.store,
			pending: {
				subscribe: this.pending.subscribe,
			},
			errors: {
				subscribe: this.errorStore.subscribe,
			},
			setSyncAction: this.setSyncAction.bind( this ),
		};
	}
}
