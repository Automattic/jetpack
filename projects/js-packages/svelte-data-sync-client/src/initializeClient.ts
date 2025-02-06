import { derived } from 'svelte/store';
import { z } from 'zod';
import { DataSync } from './DataSync.js';
import { SyncedStore } from './SyncedStore.js';

/**
 * Initialize the client-side data sync.
 *
 * Usage:
 *
 *  1:	Which namespace to use?
 *			- This is the name of the global variable that will be used to store the data.
 *			- It's also the name of the REST API endpoint.
 * 			- For more information, @see getValidatedValue
 * 	2:	Create a Store that's going to sync.
 *  3:	Reference $favoritesEnabled in Svelte component to use it as a regular Svelte Store.
 * 	4:	To disable the favorites feature, you can use a regular svelte store assignment.
 * 		This will update the Svelte Store and POST `false` to `example.com/wp-json/jetpack-favorites/status`
 * ```js
 * 1: 	const client = initializeClient( 'jetpack_favorites' );
 * 2: 	const option = client.createAsyncStore( 'status', z.boolean().default( true ) );
 * 		/// In YourComponent.svelte:
 * 3: 	const favoritesEnabled = option.store;
 * 		$: console.log( $favoritesEnabled );
 * 4:	$favoritesEnabled = false;
 */
export function initializeClient( namespace: string ) {
	const errorStores = [];

	type AsyncStoreOptions = {
		// If this is set to true, the store won't be added to the global error store.
		hideFromGlobalErrors?: boolean;
	};
	function createAsyncStore< Schema extends z.ZodSchema, Value extends z.infer< Schema > >(
		valueName: string,
		schema: Schema,
		opts: AsyncStoreOptions = {}
	) {
		const endpoint = new DataSync( namespace, valueName, schema );

		// Setup the Svelte Store and the API Endpoint for this value
		const syncedStore = new SyncedStore< Value >( endpoint.getInitialValue() );

		// The client doesn't need the whole store object.
		// Only expose selected public methods:
		const store = syncedStore.getPublicInterface();

		/**
		 * Wire up store to the endpoint.
		 * When the store changes, this will POST the value to the endpoint.
		 *
		 * This can be changed by using the `setCallback` method
		 * that `store.getPublicInterface()` exposes.
		 * For example,
		 * ```js
		 *	const client = initializeClient( 'jetpack_favorites' );
		 *	client.setSyncAction( ( preValue, value, abortSignal ) => {
		 *		return client.status.endpoint.SET( value, abortSignal );
		 *	} );
		 */
		store.setSyncAction( ( _, newValue, abortController ) =>
			endpoint.SET( newValue, abortController )
		);

		const client = {
			endpoint,
			...store,
			refresh: async () => {
				const response = await endpoint.GET();
				store.store.set( response );
				return response;
			},
		};

		if ( opts.hideFromGlobalErrors !== true ) {
			// Keep track of all the error stores that don't opt out.
			errorStores.push( client.errors );
		}

		return client;
	}

	return {
		/**
		 * Create a new Synced Store.
		 * @see createAsyncStore
		 */
		createAsyncStore,
		/**
		 * Each client has its own error store.
		 * This takes all error stores and joins them into one.
		 * Make sure that you run `globalErrorStore.subscribe()` after all the stores are created.
		 */
		globalErrorStore: () => derived( errorStores, $errorStores => $errorStores.flat() ),
	};
}
