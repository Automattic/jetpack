import { z } from 'zod';
import { ApiError } from './ApiError';
import type { ParsedValue } from './types';
import type { JSONSchema } from './utils';

type RequestParams = string | JSONSchema;
type RequestMethods = 'GET' | 'POST' | 'DELETE';

/**
 * DataSync between the client and the server.
 *
 * Expected Formatting:
 * http://localhost/wp-json/jetpack-favorites/status
 * - `http://localhost/wp-json` is the WP REST API endpoint, defined in window.{namespace}.rest_api
 * - `jetpack-favorites` is the "namespace"
 * - `status` is the "key"
 *
 * DataSync is going to expect that these values are
 * available in the global window object in the following format: window[ namespace ][ key ]:
 *
 * Note: The keys are converted to be snake_case in Objects, but kebab-case in URLs.
 */
export class DataSync< Schema extends z.ZodSchema, T extends z.infer< Schema > > {
	/**
	 * Configure the WordPress REST API Endpoint.
	 * @param wpDatasyncUrl - For example: http://localhost/wp-json/jetpack-favorites
	 */
	private wpDatasyncUrl: string;

	/**
	 * To interact with WordPress REST API, we need to provide a REST_API Nonce.
	 * This is different from the endpoint nonce that's used for every individual endpoint.
	 * @see https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/#cookie-authentication
	 */
	private wpRestNonce: string;

	/**
	 * Every endpoint has its own nonce.
	 * This is different from WP REST API nonce.
	 */
	private endpointNonce = '';

	/**
	 * The namespace of the endpoint.
	 * This matches the name of the global variable (window.{name_space}.{endpoint_name})
	 */
	private namespace: string;

	/**
	 * Same as namespace, but using dashes instead of underscores.
	 */
	private endpoint: string;

	/**
	 * Key of the value that's being synced.
	 */
	private key: string;

	constructor( namespace: string, key: string, private schema: Schema ) {
		this.namespace = namespace;
		this.key = key;

		/**
		 * Convert underscores to dashes,
		 * because all endpoints are kebab-case and options are snake_case.
		 */
		this.endpoint = this.key.replaceAll( '_', '-' );

		/**
		 * `window.[name].rest_api` is a special value that's required for the API to work.
		 * It's populated by the `wp-js-data-sync` package and contains the REST API endpoint and nonce.
		 */
		try {
			const { value, nonce } = this.getWindowValue( 'rest_api', z.string().url() );
			this.wpRestNonce = nonce;
			this.wpDatasyncUrl = value;
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error(
				`Failed to connect to REST API because of an invalid "window.${ this.namespace }.rest_api" value:\n`,
				`	Expected Example: `,
				{ value: 'https://example.com/wp-json', nonce: 'abc123' },
				`\n	Received Value: `,
				window[ namespace ]?.rest_api,
				'\n\nError originated from: \n ',
				e
			);
		}

		/**
		 * Setup the endpoint nonce
		 */
		try {
			const { nonce } = this.getWindowValue( this.key, schema );
			this.endpointNonce = nonce;
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error(
				`Failed to connect to REST API because of an invalid "window.${ this.namespace }.${ this.key }" value:\n`,
				`	Expected Example: `,
				{ value: '<any>', nonce: 'abc123' },
				`\n	Received Value: `,
				window[ namespace ]?.[ this.key ],
				'\n\nError originated from: \n ',
				e
			);
		}
	}

	/**
	 * This is a helper function to get values
	 * from the window object and validate them.
	 *
	 * @param namespace - The namespace of the value. For example, `jetpack_favorites`.
	 * @param valueName - The name of the value. For example, `posts`.
	 * @param valueSchema - The Zod schema to validate the value against.
	 * @returns The parsed value.
	 */
	private getWindowValue< V extends z.ZodSchema >(
		valueName: string,
		valueSchema: V
	): ParsedValue< V > {
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
		const source = window[ this.namespace ][ valueName ]
			? window[ this.namespace ][ valueName ]
			: { value: undefined, nonce: '' };

		const result = validator.parse( source );
		return result as ParsedValue< V >;
	}

	/**
	 * The API Class should already be initialized with
	 * the Base URL (that includes the REST namespace) and the REST nonce.
	 * @see initialize
	 *
	 * So request methods need only the endpoint path,
	 * For example:
	 * ```js
	 * const api = new API();
	 * api.initialize( 'http://localhost/wp-json/jetpack-favorites', 'abcdefghij' );
	 * api.request( 'posts' );
	 * ```
	 * This would make a request to: http://localhost/wp-json/jetpack-favorites/posts
	 */
	private async request(
		method: RequestMethods,
		partialPathname: string,
		params?: RequestParams,
		abortSignal?: AbortSignal
	) {
		const url = `${ this.wpDatasyncUrl }/${ partialPathname }`;
		const args: RequestInit = {
			method,
			signal: abortSignal,
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': this.wpRestNonce,
				'X-Jetpack-WP-JS-Sync-Nonce': this.endpointNonce,
			},
			credentials: 'same-origin',
			body: null,
		};

		if ( method === 'POST' ) {
			args.body = JSON.stringify( { JSON: params } );
		}

		const result = await this.attemptRequest( url, args );

		let data;
		const text = await result.text();
		try {
			data = JSON.parse( text );
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( 'Failed to parse the response\n', { url, text, result, error: e } );
			throw new ApiError( url, 'json_parse_error', 'Failed to parse the response' );
		}

		/**
		 * `data.JSON` is used to keep in line with how WP REST API parses request json params
		 * It also allows frees up the the endpoint to accept other values in the root of the JSON object
		 * if that ever becomes necessary.
		 * @see https://developer.wordpress.org/reference/classes/wp_rest_request/parse_json_params/
		 * @see https://github.com/WordPress/wordpress-develop/blob/28f10e4af559c9b4dbbd1768feff0bae575d5e78/src/wp-includes/rest-api/class-wp-rest-request.php#L701
		 */
		if ( ! data || data.JSON === undefined ) {
			// eslint-disable-next-line no-console
			console.error( 'JSON response is empty.\n', { url, text, result } );
			throw new ApiError( url, 'json_empty', 'JSON response is empty' );
		}

		return data.JSON;
	}

	private async parsedRequest(
		method: RequestMethods = 'GET',
		path = '',
		params?: T,
		abortSignal?: AbortSignal
	): Promise< T > {
		const data = await this.request( method, this.endpoint, params, abortSignal );
		try {
			const parsed = this.schema.parse( data );
			return parsed;
		} catch ( error ) {
			const url = `${ this.endpoint }/${ path }`;
			// Log Zod validation errors to the console.
			// eslint-disable-next-line no-console
			console.error( error );
			throw new ApiError( url, 'schema_error', 'Schema validation failed' );
		}
	}

	private async attemptRequest( url: string, args: RequestInit ) {
		try {
			const result = await fetch( url, args );
			if ( ! result.ok ) {
				throw new ApiError( url, result.status, result.statusText );
			}

			return result;
		} catch ( e ) {
			throw new ApiError( url, 'failed_to_sync', e.message );
		}
	}

	/**
	 * Public Interface:
	 *
	 * Class member variables, instead of class methods, because they need
	 * to be bound to the class instance, to make it easier to pass them
	 * around as callbacks without losing the `this` context.
	 */
	public GET = async ( abortSignal?: AbortSignal ): Promise< T > => {
		return await this.parsedRequest( 'GET', '', undefined, abortSignal );
	};

	public SET = async ( params: T, abortSignal?: AbortSignal ): Promise< T > => {
		return await this.parsedRequest( 'POST', '/set', params, abortSignal );
	};

	public MERGE = async ( params: T, abortSignal?: AbortSignal ): Promise< T > => {
		return await this.parsedRequest( 'POST', '/merge', params, abortSignal );
	};

	public DELETE = async ( abortSignal?: AbortSignal ) => {
		return await this.parsedRequest( 'POST', 'delete', undefined, abortSignal );
	};

	public getInitialValue = () => {
		return this.getWindowValue( this.key, this.schema ).value;
	};
}
