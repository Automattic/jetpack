// @TODO: need feedback on this: 👇
import type { AsyncOptions as AO } from '@async-options/types';
import { writable } from 'svelte/store';

export class Options< T extends AO.Options > {
	private options: T;

	constructor( options: T ) {
		this.options = options;
	}

	public get< K extends keyof T >( key: K ) {
		return this.options[ key ];
	}

	private createPendingStore(): AO.PendingStore {
		const { set, subscribe } = writable( false );
		return {
			subscribe,
			stop: () => set( false ),
			start: () => set( true ),
		};
	}

	public value< K extends keyof T >( key: K ): T[ K ][ 'value' ] {
		return this.options[ key ].value;
	}

	private compare( a: any, b: any ) {
		if ( typeof a == 'object' && typeof b == 'object' ) {
			return Object.entries( a ).sort().toString() === Object.entries( b ).sort().toString();
		}
		return a === b;
	}

	public createStore< K extends keyof T >(
		key: K,
		updateCallback: ( value: T[ K ] ) => Promise< T[ K ][ 'value' ] >
	): AO.OptionStore< T[ K ][ 'value' ] > {
		const store = writable( this.value( key ) );
		const pending = this.createPendingStore();

		let requestLock = false;
		let debounce = 0;

		// Sync the value to the API
		// And make sure that the value
		// hasn't changed since it was last submitted.
		const send = async ( value: T[ K ][ 'value' ], attempt = 0 ) => {
			// Prevent multiple requests from being sent at once.
			if ( requestLock ) {
				return;
			}

			// If UI Changes rapidly, wait for it to settle before issuing the request.
			if ( debounce ) {
				clearTimeout( debounce );
			}

			// Sync the setting to the server
			debounce = setTimeout( async () => {
				requestLock = true;
				let result = await updateCallback( {
					...this.options[ key ],
					value,
				} );
				requestLock = false;

				// Ensure that the database has the same value as the UI
				if ( ! this.compare( result, value ) ) {
					if ( attempt >= 3 ) {
						console.error(
							"Auto-retry failed because REST API keeps returning values that don't match the UI.",
							result,
							value
						);
						pending.stop();
						return;
					}
					send( value, attempt + 1 );
				}
				pending.stop();
			}, 200 * ( 1 + attempt * 2 ) );
		};

		// Send the store value to the API
		store.set = ( value: T[ K ][ 'value' ] ) => {
			pending.start();
			store.update( () => value );
			send( value );
		};

		return {
			value: store,
			pending: pending,
		};
	}
}
