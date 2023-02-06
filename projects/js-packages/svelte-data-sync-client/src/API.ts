/* eslint-disable no-console */
import { maybeStringify, JSONSchema } from './utils';
export type RequestParams = string | JSONSchema;
export type RequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export class API {
	private baseUrl: string;
	private restNonce: string;

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

	public async request(
		endpoint: string,
		method: RequestMethods = 'GET',
		nonce: string,
		params?: RequestParams
	) {
		if ( ! this.isInitialized() ) {
			console.error( 'API is not initialized', {
				baseUrl: this.baseUrl,
				restNonce: this.restNonce,
			} );
			return null;
		}

		const url = `${ this.baseUrl }/${ endpoint }`;

		const args: RequestInit = {
			method,
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': this.restNonce,
				'X-Jetpack-WP-JS-Sync-Nonce': nonce,
			},
			credentials: 'same-origin',
			body: null,
		};

		if ( method === 'POST' && params ) {
			args.body = maybeStringify( {
				JSON: params,
			} );
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
