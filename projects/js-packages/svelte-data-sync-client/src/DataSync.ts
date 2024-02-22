import { z } from 'zod';
import { ApiError } from './ApiError.js';
import type { ParsedValue } from './types.js';
import type { JSONSchema } from './utils.js';

type RequestParams = string | JSONSchema;
type RequestMethods = 'GET' | 'POST' | 'DELETE';

/**
 * DataSync class for synchronizing data between the client and the server.
 *
 * Expected Formatting:
 * http://localhost/wp-json/jetpack-favorites/status
 * - `http://localhost/wp-json` is the WP REST API endpoint, defined in window.{namespace}.rest_api
 * - `jetpack-favorites` is the "namespace"
 * - `status` is the "key"
 *
 * DataSync expects these values to be
 * available in the global window object in the following format: window[ namespace ][ key ]:
 *
 * Note: The keys are converted to be snake_case in Objects, but kebab-case in URLs.
 */
export class DataSync< Schema extends z.ZodSchema, Value extends z.infer< Schema > > {
	/**
	 * WordPress REST API Endpoint configuration.
	 * @param wpDatasyncUrl - For example: http://localhost/wp-json/jetpack-favorites
	 */
	private wpDatasyncUrl: string;

	/**
	 * Nonce for WordPress REST API interaction.
	 * This is different from the endpoint nonce that's used for every individual endpoint.
	 * @see https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/#cookie-authentication
	 */
	private wpRestNonce: string;

	/**
	 * Nonce for every endpoint.
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

	/**
	 * Constructor for the DataSync class.
	 *
	 * Example usage:
	 * ```js
	 * const dataSync = new DataSync('namespace', 'key', schema);
	 * ```
	 * This would make a request to: http://localhost/wp-json/namespace/key
	 *
	 * @param namespace - The namespace of the endpoint. This matches the name of the global variable (window.{namespace}.{endpoint_name}).
	 * @param key - The key of the value that's being synced. This is used to fetch the value from the global window object.
	 * @param schema - The Zod schema to validate the value against. This ensures that the value is of the expected type.
	 */
	constructor(
		namespace: string,
		key: string,
		private schema: Schema
	) {
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
	 * Helper function to get values
	 * from the window object and validate them.
	 *
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

	/**
	 * Method to parse the request.
	 * @param method - The request method.
	 * @param requestPath - The request path.
	 * @param params - The request parameters.
	 * @param abortSignal - The abort signal.
	 * @returns The parsed value.
	 */
	private async parsedRequest(
		method: RequestMethods,
		requestPath = '',
		params?: Value,
		abortSignal?: AbortSignal
	): Promise< Value > {
		const data = await this.request( method, requestPath, params, abortSignal );
		try {
			const parsed = this.schema.parse( data );
			return parsed;
		} catch ( error ) {
			const url = `${ this.wpDatasyncUrl }/${ requestPath }`;
			// Log Zod validation errors to the console.
			// eslint-disable-next-line no-console
			console.error( error );
			throw new ApiError( url, 'schema_error', 'Schema validation failed' );
		}
	}

	/**
	 * Method to attempt the request.
	 * @param url - The request URL.
	 * @param args - The request arguments.
	 * @returns The result of the request.
	 */
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
	public GET = async ( abortSignal?: AbortSignal ): Promise< Value > => {
		return await this.parsedRequest( 'GET', this.endpoint, undefined, abortSignal );
	};

	public SET = async ( params: Value, abortSignal?: AbortSignal ): Promise< Value > => {
		return await this.parsedRequest( 'POST', `${ this.endpoint }/set`, params, abortSignal );
	};

	public MERGE = async ( params: Value, abortSignal?: AbortSignal ): Promise< Value > => {
		return await this.parsedRequest( 'POST', `${ this.endpoint }/merge`, params, abortSignal );
	};

	public DELETE = async ( abortSignal?: AbortSignal ) => {
		return await this.parsedRequest( 'POST', `${ this.endpoint }/delete`, undefined, abortSignal );
	};

	/**
	 * Method to get the initial value from the window object.
	 * @returns The initial value.
	 */
	public getInitialValue = () => {
		return this.getWindowValue( this.key, this.schema ).value;
	};
}
