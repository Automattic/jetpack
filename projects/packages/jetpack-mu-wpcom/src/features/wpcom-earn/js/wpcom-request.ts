export type WpcomApi = 'wpcom/v2' | 'rest/v1.1';

export interface WpcomRequest {
	api: WpcomApi;
	/** Relative to the site, or under `me/` for the current user. */
	path: string;
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
	query?: Record< string, string | number | boolean | undefined >;
	data?: unknown;
}

export interface FetchOptions {
	path: string;
	method: string;
	data?: unknown;
	/** Keeps WordPress.com from scoping a Simple site's `me/` request to the site. */
	global?: boolean;
}

/**
 * Must match WPCOM_Earn_Proxy's namespace and base.
 */
export const PROXY_BASE = '/wpcom/v2/earn-proxy';

/**
 * Where a WordPress.com request goes: straight to WordPress.com on Simple, through the page's proxy on Atomic.
 *
 * @param request  - The request.
 * @param isAtomic - Whether the site is Atomic.
 * @return The apiFetch options.
 */
export function toFetchOptions( request: WpcomRequest, isAtomic: boolean ): FetchOptions {
	const { api, path, method = 'GET', query = {}, data } = request;
	const search = new URLSearchParams();

	for ( const [ key, value ] of Object.entries( query ) ) {
		if ( value !== undefined ) {
			search.append( key, String( value ) );
		}
	}

	const base = isAtomic ? `${ PROXY_BASE }/${ api }/${ path }` : `/${ api }/${ path }`;
	const queryString = search.toString();
	const options: FetchOptions = {
		path: queryString ? `${ base }?${ queryString }` : base,
		method,
		...( data === undefined ? {} : { data } ),
	};

	if ( ! isAtomic && path.startsWith( 'me/' ) ) {
		options.global = true;
	}

	return options;
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
 * Reject a body that reports an error under a success status, as memberships endpoints do.
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
		const { code = 'error', message = '' } = error as { code?: string; message?: string };
		throw new WpcomApiError( code, message );
	}

	return body;
}
