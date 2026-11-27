/**
 * `wpcom.req` stand-in that sends the dashboard's requests to the site's own REST API with apiFetch.
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

type Params = {
	path: string;
	apiNamespace?: string;
	method?: string;
	responseType?: 'blob';
};

type Query = Record< string, unknown > | undefined;

export type WPError = Error & Record< string, unknown > & { statusCode?: number };

/**
 * Turn a failed response body into an Error carrying the body's fields, as `wp-error` did.
 *
 * @param body   - Response body.
 * @param status - HTTP status.
 * @return Error.
 */
function toError( body: Record< string, unknown > | null, status?: number ): WPError {
	const message =
		( body?.message as string ) || ( body?.error as string ) || ( body?.code as string ) || 'Error';
	const error = new Error( message ) as WPError;
	Object.assign( error, body || {}, {
		statusCode: status ?? ( body?.data as { status?: number } )?.status,
	} );
	return error;
}

/**
 * Send a request.
 *
 * @param method - HTTP method.
 * @param params - wpcom.js params.
 * @param data   - Query (GET) or body.
 * @return Response body.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Callers type the response, as with wpcom.js.
async function request< T = any >( method: string, params: Params, data: Query ): Promise< T > {
	const namespace = params.apiNamespace || 'jetpack/v4/blaze-app';
	const base = `/${ namespace }${ params.path }`;
	const isRead = method === 'GET';
	const path = isRead && data ? addQueryArgs( base, data ) : base;

	try {
		if ( params.responseType === 'blob' ) {
			const response = ( await apiFetch( { path, method, parse: false } ) ) as Response;
			const type = response.headers.get( 'content-type' ) || '';
			if ( type.includes( 'application/json' ) ) {
				const json = await response.json();
				return new Blob( [ typeof json === 'string' ? json : JSON.stringify( json ) ], {
					type: 'text/csv',
				} ) as T;
			}
			return ( await response.blob() ) as T;
		}

		return ( await apiFetch( {
			path,
			method,
			...( ! isRead && data ? { data } : {} ),
		} ) ) as T;
	} catch ( error ) {
		if ( error instanceof Response ) {
			let body = null;
			try {
				body = await error.json();
			} catch {
				// Not JSON.
			}
			throw toError( body, error.status );
		}
		throw toError( error as Record< string, unknown > );
	}
}

const wpcom = {
	req: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		get: < T = any >( params: Params, query?: Query ) => request< T >( 'GET', params, query ),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		post: < T = any >( params: Params, body?: Query ) => request< T >( 'POST', params, body ),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		put: < T = any >( params: Params, body?: Query ) => request< T >( 'PUT', params, body ),
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		del: < T = any >( params: Params, body?: Query ) => request< T >( 'DELETE', params, body ),
	},
};

export default wpcom;
