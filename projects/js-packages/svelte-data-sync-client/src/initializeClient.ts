import { z } from 'zod';
import { API } from './API';
import { API_Endpoint } from './Endpoint';
import { SyncedStore } from './SyncedStore';
import { ValidatedValue } from './types';

/**
 * This is a helper function to get values
 * from the window object and validate them.
 *
 * @param namespace - The namespace of the value. For example, `jetpack_favorites`.
 * @param valueName - The name of the value. For example, `posts`.
 * @param valueSchema - The Zod schema to validate the value against.
 * @returns The validated value.
 */
export function getValidatedValue< T extends z.ZodSchema >(
	namespace: string,
	valueName: string,
	valueSchema: T
): ValidatedValue< T > {
	const validator = z.object( {
		value: valueSchema,
		nonce: z.string(),
	} );

	/**
	 * This function handles fetching nonces if they're there
	 * But it shouldn't trigger errors if the nonce is missing.
	 * Allowing the client application to decide
	 * how to handle missing nonces.
	 *
	 * This is useful, for example, if the `valueSchema` is set to something
	 * like `z.string().optional()`. In this case, the application might be
	 * okay with a missing value, so a missing nonce would trigger an unexpected
	 * error.
	 */
	const source = window[ namespace ][ valueName ]
		? window[ namespace ][ valueName ]
		: { value: undefined, nonce: '' };

	const result = validator.parse( source );

	return result as ValidatedValue< T >;
}

// `window.[name].rest_api` is a special value that's required for the API to work.
// It's populated by the `wp-js-data-sync` package and contains the REST API endpoint and nonce.
function setupRestApi( namespace: string ) {
	const api = new API();
	try {
		const { value, nonce } = getValidatedValue( namespace, 'rest_api', z.string().url() );
		api.initialize( value, nonce );
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.error(
			`Failed to connect to REST API because of an invalid "window.${ namespace }.rest_api" value:\n`,
			`	Expected Example: `,
			{ value: 'https://example.com/wp-json', nonce: 'abc123' },
			`\n	Received Value: `,
			window[ namespace ]?.rest_api,
			'\n\nError originated from: \n ',
			e
		);
	}

	return api;
}

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
	const api = setupRestApi( namespace );

	function createAsyncStore< T extends z.ZodSchema >( valueName: string, schema: T ) {
		// Get the value from window and validate it with the schema.
		const { nonce, value } = getValidatedValue( namespace, valueName, schema );

		// Setup the Svelte Store and the API Endpoint for this value
		const store = new SyncedStore< z.infer< T > >( value );
		const endpoint = new API_Endpoint< z.infer< T > >( api, valueName, schema );

		/**
		 * Wire up store to the endpoint.
		 * When the store changes, this will:
		 * 	- Use the nonce that was provided by the server
		 *	- POST the value to the endpoint
		 *
		 * This can be changed by using the `setCallback` method
		 * that `store.getPublicInterface()` exposes.
		 * For example,
		 * ```js
		 *	const client = initializeClient( 'jetpack_favorites' );
		 *	client.setCallback( 'status', ( value ) => {
		 *		client.endpoint.status.POST( value.replace("a", "b") );
		 *	} );
		 */
		endpoint.nonce = nonce;
		store.setCallback( endpoint.POST );

		// The client doesn't need the whole store object.
		// Only expose selected public methods:
		const storeInterface = store.getPublicInterface();

		return {
			endpoint,
			...storeInterface,
		};
	}
	return {
		createAsyncStore,
		api,
	};
}
