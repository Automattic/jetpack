import type { EntryData } from '@src/utils/Validator';

import { maybeStringify } from '@src/utils/maybeStringify';

type RequestParams = string | { [ key: string ]: any };

export default class AsyncAPI {
	constructor( private baseUrl: string, private restNonce: string ) {}

	private async request(
		endpoint: string,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
		nonce: string = '',
		params?: RequestParams
	): Promise< unknown > {
		const url = `${ this.baseUrl }/${ endpoint }`;

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
			return;
		}

		let data = '';
		const text = await result.text();
		try {
			data = JSON.parse( text );
		} catch ( e ) {
			console.error( 'Failed to parse the response\n', { url, text, result, error: e } );
		}

		return data;
	}

	public async GET< T >(
		endpoint: string,
		nonce: string = '',
		params?: RequestParams
	): Promise< T > {
		// @TODO: This is a hack
		// @TODO Validate T somewhere.
		return ( await this.request( endpoint, 'GET', nonce, params ) ) as T;
	}

	public async POST< T >( endpoint: string, nonce: string, params?: RequestParams ): Promise< T > {
		// @TODO: This is a hack
		// @TODO Validate T somewhere.
		return ( await this.request( endpoint, 'POST', nonce, params ) ) as T;
	}

	public async DELETE( endpoint: string, nonce: string = '' ) {
		return await this.request( endpoint, 'DELETE', nonce );
	}

	public async sendRequest( data: EntryData ) {
		// data.body = maybeStringify(data.body);
		// data.headers = maybeStringify(data.headers);
		return await this.POST( 'send-request', '', maybeStringify( data ) );
	}
}
