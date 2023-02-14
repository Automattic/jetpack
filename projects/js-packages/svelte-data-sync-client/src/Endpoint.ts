import { z } from 'zod';
import { API, RequestMethods, RequestParams } from './API';

/**
 * Every SyncedStore option has its own API Endpoint.
 */
export class API_Endpoint< T extends RequestParams > {
	public nonce = '';

	private endpoint: string;

	constructor( private api: API, private name: string, private schema: z.ZodSchema ) {
		/**
		 * Convert underscores to dashes,
		 * because all endpoints are kebab-case and options are snake_case.
		 * For example, `jetpack_favorites` becomes `jetpack-favorites`.
		 *
		 * For more information on the shape of the API,
		 * @see API.request
		 */
		this.endpoint = this.name.replace( '_', '-' );
	}

	public async validatedRequest( method: RequestMethods = 'GET', params?: T ): Promise< T > {
		const request = this.api.request( this.endpoint, method, this.nonce, params );
		return await request.then( data => {
			return this.schema.parse( data );
		} );
	}

	/**
	 * Class member variables:
	 *
	 * Variables below are class member variables, instead of class methods,
	 * because they need to be bound to the class instance, to make it
	 * easier to pass them around as callbacks
	 * without losing the `this` context.
	 */
	public GET = async (): Promise< T > => {
		return await this.validatedRequest( 'GET' );
	};

	public POST = async ( params: T ): Promise< T > => {
		return await this.validatedRequest( 'POST', params );
	};

	public DELETE = async () => {
		return await this.validatedRequest( 'DELETE' );
	};
}
