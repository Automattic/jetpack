import { writable } from 'svelte/store';
import { sleep } from './utils';
import type { Pending, SyncedStoreInterface, SyncedWritable, SyncedStoreCallback } from './types';

/*
 * A custom Svelte Store that's used to indicate if a value is being synced.
 */
export class SyncedStore< T > {
	private store: SyncedWritable< T >;
	private pending: Pending;
	private pendingValue: T | undefined;
	private requestLock = false;
	private failedToSync = Symbol( 'failedToSync' );
	private updateCallback?: SyncedStoreCallback< T >;

	constructor( initialValue?: T ) {
		this.store = this.createStore( initialValue );
		this.pending = this.createPendingStore();
	}

	private createStore( initialValue?: T ): SyncedWritable< T > {
		const store = writable< T >( initialValue );

		// Send the store value to the API
		store.set = value => {
			store.update( prevValue => {
				// Synchronize is an async function, but is called without await here.
				// This intentionally prevents the store from waiting for the request to complete.
				// This is because we want the store to update immediately,
				// and then the request to happen in the background.
				this.debouncedSynchronize( prevValue, value );
				return value;
			} );
		};

		const override = ( value: T ) => {
			store.update( () => value );
		};

		return {
			...store,
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

	private async synchronize( prevValue, value: T ): Promise< T | typeof this.failedToSync > {
		if ( ! this.updateCallback ) {
			return value;
		}
		const result = await this.updateCallback( value );

		// Success is only when the updateCallback result matches the value.
		if ( this.equals( result, value ) ) {
			return result;
		}

		return this.failedToSync;
	}

	private async debouncedSynchronize( prevValue, value: T, attempt = 0 ) {
		// attempt = 0 indicates that this is run from the store.set() function.
		const syncRequestFromStore = attempt === 0;

		// If this is an update issued by the store, then there are two scenarios,
		// where we don't need to issue a new Synchronize request:
		// 1. The previous value is the same as the new value.
		// 2. There's already a value pending, and it's the same as the new value.
		//
		if (
			syncRequestFromStore &&
			( this.equals( prevValue, value ) ||
				( this.pendingValue !== undefined && this.equals( this.pendingValue, value ) ) )
		) {
			return;
		}

		// If this is an update from the store, then we need to update the pending value.
		// Store the value in case the UI changes rapidly.
		// This will be read after the debounce.
		if ( syncRequestFromStore ) {
			this.pendingValue = value;
		}

		// Prevent multiple requests from being sent at once.
		if ( this.requestLock && syncRequestFromStore ) {
			return;
		}
		this.requestLock = true;

		// If UI Changes rapidly, wait for it to settle before issuing the request.
		await sleep( 200 + 600 * attempt );

		// The pending value may change while debouncing.
		// If it's now the same as the previous value, don't send the request.
		if ( this.pendingValue === prevValue ) {
			// eslint-disable-next-line no-console
			this.requestLock = false;
			this.pendingValue = undefined;
			return;
		}

		try {
			const result = await this.synchronize( prevValue, this.pendingValue );
			// Retry on two conditions:
			// 1) The request failed to sync, but didn't throw an error
			// 2) The pending value has changed since the request was sent
			if ( result === this.failedToSync && attempt < 3 ) {
				return this.debouncedSynchronize( prevValue, this.pendingValue, attempt + 1 );
			}

			if ( syncRequestFromStore && result !== this.failedToSync && result !== this.pendingValue ) {
				// Using result instead of prevValue here
				// Because we received fresher "real value" from the API.
				return this.debouncedSynchronize( result, this.pendingValue, 1 );
			}

			if ( result !== this.failedToSync ) {
				this.requestLock = false;
				this.pendingValue = undefined;
				return result;
			}
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( e );
		}

		// At this point, the request has either thrown and logged an error
		// or the value returned from the API doesn't match the value sent to the API.
		// Flip back the value and allow the synchronization to happen again.
		this.store.override( prevValue );
		this.requestLock = false;
		this.pendingValue = undefined;

		// eslint-disable-next-line no-console
		console.error(
			"Failed to sync value to the API. The value returned from the API doesn't match the value sent to the API."
		);
		return this.failedToSync;
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
			return Object.entries( a ).sort().toString() === Object.entries( b ).sort().toString();
		}
		return a === b;
	}
}
