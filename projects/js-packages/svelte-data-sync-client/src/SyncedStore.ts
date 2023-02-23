import deepEqual from 'deep-equal';
import { writable } from 'svelte/store';
import { sleep } from './utils';
import type { Pending, SyncedStoreInterface, SyncedWritable, SyncedStoreCallback } from './types';
/*
 * A custom Svelte Store that's used to indicate if a value is being synced.
 */
export class SyncedStore< T > {
	private store: SyncedWritable< T >;
	private pending: Pending;
	private failedToSync = Symbol( 'failedToSync' );
	private updateCallback?: SyncedStoreCallback< T >;
	private abortController: AbortController;

	constructor( initialValue?: T ) {
		this.store = this.createStore( initialValue );
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

	public getPublicInterface(): SyncedStoreInterface< T > {
		return {
			store: this.store,
			pending: {
				subscribe: this.pending.subscribe,
			},
			setCallback: this.setCallback.bind( this ),
		};
	}

	public setCallback( callback: SyncedStoreCallback< T > ) {
		this.updateCallback = callback;
	}

	private async synchronize( value: T ): Promise< T | typeof this.failedToSync > {
		if ( ! this.updateCallback ) {
			return value;
		}
		const result = await this.updateCallback( value, this.abortController.signal );

		// Success is only when the updateCallback result matches the value.
		if ( this.equals( result, value ) ) {
			return result ? result : value;
		}

		return this.failedToSync;
	}

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

		if ( result === this.failedToSync ) {
			if ( retry < 3 ) {
				// Wait a second before retrying.
				await sleep( 1000 );
				if ( signal.aborted ) {
					return;
				}
				this.abortableSynchronize( prevValue, value, retry + 1 );
				return;
			}

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
}
