import { maybeStringify } from '@async-options/utils';

type RequestParams = string | { [ key: string ]: any };

export default class AsyncAPI {
	constructor( private baseUrl: string, private restNonce: string ) {}

	private async request< T >(
		endpoint: string,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
		nonce: string = '',
		params?: RequestParams
	): Promise< T > {
		let url = `${ this.baseUrl }/${ endpoint }`;

		const result = await fetch( url, {
			method,
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': this.restNonce,
				'X-Async-Options-Nonce': nonce,
			},
			credentials: 'same-origin',
			body: method === 'POST' && params ? maybeStringify( params ) : undefined,
		} );

		if ( ! result.ok ) {
			console.error( 'Failed to fetch', url, result );
			throw new Error( `Failed to "${ method }" to ${ url }. Received ${ result.status }` );
		}

		let data = '';
		const text = await result.text();
		try {
			data = JSON.parse( text );
		} catch ( e ) {
			console.error( 'Failed to parse the response\n', { url, text, result, error: e } );
		}

		/**
		 * @TODO: Add zod to the received data.
		 */
		return ( data as unknown ) as T;
	}

	public async GET< T >(
		endpoint: string,
		nonce: string = '',
		params?: RequestParams
	): Promise< T > {
		return await this.request( endpoint, 'GET', nonce, params );
	}

	public async POST< T >( endpoint: string, nonce: string, params?: RequestParams ): Promise< T > {
		return await this.request( endpoint, 'POST', nonce, params );
	}

	public async DELETE( endpoint: string, nonce: string = '' ) {
		return await this.request( endpoint, 'DELETE', nonce );
	}
}
