export type WpcomApi = 'wpcom/v2' | 'rest/v1.1';

export interface WpcomRequest {
	api: WpcomApi;
	/** Relative to the site, e.g. `memberships/coupons`. */
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	query?: Record< string, string | number | boolean | undefined >;
	data?: unknown;
}

export interface FetchOptions {
	path: string;
	method: string;
	data?: unknown;
}

/**
 * Must match WPCOM_Proxy's namespace and base.
 */
export const PROXY_BASE = '/jetpack/v4/monetize';

/**
 * Where a WordPress.com request goes: straight to WordPress.com on Simple, through the site's forwarding route elsewhere.
 *
 * @param request  - The request.
 * @param isSimple - Whether the site is WordPress.com Simple, whose apiFetch already scopes requests to the site.
 * @return The apiFetch options.
 */
export function toFetchOptions( request: WpcomRequest, isSimple: boolean ): FetchOptions {
	const { api, path, method = 'GET', query = {}, data } = request;
	const search = new URLSearchParams();

	for ( const [ key, value ] of Object.entries( query ) ) {
		if ( value !== undefined ) {
			search.append( key, String( value ) );
		}
	}

	const base = isSimple ? `/${ api }/${ path }` : `${ PROXY_BASE }/${ api }/${ path }`;
	const queryString = search.toString();

	return {
		path: queryString ? `${ base }?${ queryString }` : base,
		method,
		...( data === undefined ? {} : { data } ),
	};
}

export class WpcomApiError extends Error {
	code: string;

	constructor( code: string, message: string ) {
		super( message );
		this.name = 'WpcomApiError';
		this.code = code;
	}
}

/**
 * Turn whatever a request rejected with, such as apiFetch's `{ code, message }` object, into a WpcomApiError.
 *
 * @param error - The rejection.
 * @return The error.
 */
export function toWpcomApiError( error: unknown ): WpcomApiError {
	if ( error instanceof WpcomApiError ) {
		return error;
	}

	const { code = 'error', message = '' } = ( error ?? {} ) as { code?: string; message?: string };
	return new WpcomApiError( code, message );
}

/**
 * Reject a body that reports an error under a success status, as the memberships endpoints do.
 *
 * @param body - The response body.
 * @return The body, when it reports no error.
 */
export function rejectBodyError< T >( body: T ): T {
	const error = ( body as { error?: unknown } | null )?.error;

	if ( typeof error === 'string' && error ) {
		throw new WpcomApiError( 'error', error );
	}

	if ( error && typeof error === 'object' ) {
		throw toWpcomApiError( error );
	}

	return body;
}
