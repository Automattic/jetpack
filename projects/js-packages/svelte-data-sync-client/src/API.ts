/* eslint-disable no-console */
import { JSONSchema } from './utils';
export type RequestParams = string | JSONSchema;
export type RequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
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
	public initialize( baseUrl?: string, restNonce?: string ) {
		if ( ! baseUrl || ! restNonce ) {
			return;
		}
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

		if ( ! data || data.JSON === undefined ) {
			console.error( 'Failed to parse the response\n', { url, text, result } );
			throw new Error( `Failed to "${ method }" to ${ url }. Received ${ result.status }` );
		}

		return data.JSON;
	}
}
