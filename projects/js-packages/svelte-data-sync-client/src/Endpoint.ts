import { z } from 'zod';
import { API, RequestMethods, RequestParams } from './API';
import { ApiError } from './ApiError';

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
		this.endpoint = this.name.replaceAll( '_', '-' );
	}

	private async validatedRequest(
		method: RequestMethods = 'GET',
		path = '',
		params?: T,
		abortSignal?: AbortSignal
	): Promise< T > {
		const data = await this.api.request(
			this.endpoint + path,
			method,
			this.nonce,
			params,
			abortSignal
		);
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

	/**
	 * Class member variables:
	 *
	 * Variables below are class member variables, instead of class methods,
	 * because they need to be bound to the class instance, to make it
	 * easier to pass them around as callbacks
	 * without losing the `this` context.
	 */
	public GET = async ( abortSignal?: AbortSignal ): Promise< T > => {
		return await this.validatedRequest( 'GET', '', undefined, abortSignal );
	};

	public SET = async ( params: T, abortSignal?: AbortSignal ): Promise< T > => {
		return await this.validatedRequest( 'POST', '/set', params, abortSignal );
	};

	public MERGE = async ( params: T, abortSignal?: AbortSignal ): Promise< T > => {
		return await this.validatedRequest( 'POST', '/merge', params, abortSignal );
	};

	public DELETE = async ( abortSignal?: AbortSignal ) => {
		return await this.validatedRequest( 'POST', 'delete', undefined, abortSignal );
	};
}
