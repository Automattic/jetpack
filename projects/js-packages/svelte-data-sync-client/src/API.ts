/* eslint-disable no-console */
import { ApiError } from './ApiError';
import { JSONSchema } from './utils';
export type RequestParams = string | JSONSchema;
export type RequestMethods = 'GET' | 'POST' | 'DELETE';
export class API {
	private baseUrl: string;
	private restNonce: string;

	/**
	 * The API class must be initialized with
	 * the base URL and the REST nonce.
	 *
	 * @param baseUrl - For example: http://localhost/wp-json/jetpack-favorites
	 * @param restNonce - For example: abcdefghij
	 */
	public initialize( baseUrl: string, restNonce: string ) {
		this.baseUrl = baseUrl;
		this.restNonce = restNonce;
	}

	public isInitialized() {
		return !! this.baseUrl && !! this.restNonce;
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
	public async request(
		partialPathname: string,
		method: RequestMethods = 'GET',
		endpointNonce: string,
		params?: RequestParams,
		abortSignal?: AbortSignal
	) {
		if ( ! this.isInitialized() ) {
			console.error( 'API is not initialized', {
				baseUrl: this.baseUrl,
				restNonce: this.restNonce,
			} );
			return null;
		}

		const url = `${ this.baseUrl }/${ partialPathname }`;

		const args: RequestInit = {
			method,
			signal: abortSignal,
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': this.restNonce,
				'X-Jetpack-WP-JS-Sync-Nonce': endpointNonce,
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
			console.error( 'JSON response is empty.\n', { url, text, result } );
			throw new ApiError( url, 'json_empty', 'JSON response is empty' );
		}

		return data.JSON;
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
}
