/* eslint-disable no-console */
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
		params?: RequestParams
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
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': this.restNonce,
				'X-Jetpack-WP-JS-Sync-Nonce': endpointNonce,
			},
			credentials: 'same-origin',
			body: null,
		};

		if ( method === 'POST' && params ) {
			args.body = JSON.stringify( { JSON: params } );
		}

		const result = await fetch( url, args );
		if ( ! result.ok ) {
			console.error( 'Failed to fetch', url, result );
			throw new Error( `Failed to "${ method }" to ${ url }. Received ${ result.status }` );
		}

		let data;
		const text = await result.text();
		try {
			data = JSON.parse( text );
		} catch ( e ) {
			console.error( 'Failed to parse the response\n', { url, text, result, error: e } );
		}

		/**
		 * `data.JSON` is used to keep in line with how WP REST API parses request json params
		 * It also allows frees up the the endpoint to accept other values in the root of the JSON object
		 * if that ever becomes necessary.
		 * @see https://developer.wordpress.org/reference/classes/wp_rest_request/parse_json_params/
		 * @see https://github.com/WordPress/wordpress-develop/blob/28f10e4af559c9b4dbbd1768feff0bae575d5e78/src/wp-includes/rest-api/class-wp-rest-request.php#L701
		 */
		if ( ! data || data.JSON === undefined ) {
			console.error( 'Failed to parse the response\n', { url, text, result } );
			throw new Error( `Failed to "${ method }" to ${ url }. Received ${ result.status }` );
		}

		return data.JSON;
	}
}
