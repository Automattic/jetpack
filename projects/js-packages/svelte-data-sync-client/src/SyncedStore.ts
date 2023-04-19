import { Writable, writable } from 'svelte/store';
import { ApiError } from './ApiError';
import {
	Pending,
	SyncedStoreInterface,
	SyncedWritable,
	SyncedStoreCallback,
	SyncedStoreError,
} from './types';
import { sleep } from './utils';

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

	private createStore( initialValue?: T ): SyncedWritable< T > {
		const store = writable< T >( initialValue );

		// Send the store value to the API
		const set = value => {
			store.update( prevValue => {
				// Synchronize is an async function, but is called without await here.
				// This intentionally prevents the store from waiting for the request to complete.
				// This is because we want the store to update immediately,
				// and then the request to happen in the background.
				this.abortableSynchronize( structuredClone( prevValue ), value );
				return value;
			} );
		};

		type SvelteUpdater = typeof store.update;
		const update: SvelteUpdater = svelteStoreUpdate => {
			store.update( prevValue => {
				// Structured Clone is necessary because
				// the updateCallback function may mutate the value
				// And debouncedSynchronize may fail an object comparison
				// because of it.
				const prevValueClone = structuredClone( prevValue );
				const value = svelteStoreUpdate( prevValue );
				this.abortableSynchronize( prevValueClone, value );
				return value;
			} );
		};

		const override = ( value: T ) => {
			store.update( () => value );
		};

		return {
			subscribe: store.subscribe,
			set,
			update,
			override,
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
