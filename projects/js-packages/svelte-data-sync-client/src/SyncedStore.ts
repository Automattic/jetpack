import deepEqual from 'deep-equal';
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
	private updateCallback?: SyncedStoreCallback< T >;
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
				this.abortableSynchronize( prevValue, value );
				return value;
			} );
		};

		type SvelteUpdater = typeof store.update;
		const update: SvelteUpdater = updateCallback => {
			store.update( prevValue => {
				// Structured Clone is necessary because
				// the updateCallback function may mutate the value
				// And debouncedSynchronize may fail an object comparison
				// because of it.
				const value = updateCallback( prevValue );
				this.abortableSynchronize( prevValue, value );
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
	 * By default, this is set to endpoint.POST in the client initializer
	 */
	private setCallback( callback: SyncedStoreCallback< T > ) {
		this.updateCallback = callback;
	}

	/**
	 * Attempt to synchronize the store with the API.
	 */
	private async synchronize( value: T ): Promise< T | ApiError > {
		if ( ! this.updateCallback ) {
			return value;
		}

		try {
			const result = await this.updateCallback( value, this.abortController.signal );

			// Success is only when the updateCallback result matches the value.
			if ( this.equals( result, value ) ) {
				return result ? result : value;
			}
		} catch ( error ) {
			if ( error instanceof ApiError || error.name === 'ApiError' ) {
				return error as ApiError;
			}

			// Rethrow the error if it's not an ApiError.
			throw error;
		}

		return new ApiError( 'SyncedStore::synchronize', 'failed_to_sync', 'Failed to sync' );
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

		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		await sleep( 200 + 600 * retry );
		if ( signal.aborted ) {
			return;
		}
		const result = await this.synchronize( value );
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

	private equals( a: unknown, b: unknown ) {
		if ( typeof a === 'object' && typeof b === 'object' ) {
			return deepEqual( a, b );
		}

		return a === b;
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
			setCallback: this.setCallback.bind( this ),
		};
	}
}
