import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { APIFetchOptions } from '@wordpress/api-fetch';

const ROOT = '/jetpack/v4';

/**
 * Prepend `/jetpack/v4` to a path and optionally append query args.
 *
 * @param path - Path under `/jetpack/v4`, e.g. `/site/capabilities`.
 * @param args - Optional query args record.
 * @return The fully-qualified API path.
 */
export function apiPath(
	path: string,
	args?: Record< string, string | number | boolean | undefined >
): string {
	const base = `${ ROOT }${ path }`;
	if ( ! args ) {
		return base;
	}
	const filtered: Record< string, string | number | boolean > = {};
	for ( const key of Object.keys( args ) ) {
		const value = args[ key ];
		if ( value !== undefined && value !== '' ) {
			filtered[ key ] = value;
		}
	}
	return Object.keys( filtered ).length ? addQueryArgs( base, filtered ) : base;
}

/**
 * Strip the decimal suffix WPCOM ships on rewind ids (e.g.
 * `'1777035492.615'` → `'1777035492'`). The `/rewind/backup/$rewindId`
 * URLs reject the suffixed form with a 404.
 *
 * @param rewindId - Raw rewind id, possibly with a decimal suffix.
 * @return The integer-seconds portion only.
 */
export function toIntRewindId( rewindId: string ): string {
	const idx = rewindId.indexOf( '.' );
	return idx === -1 ? rewindId : rewindId.slice( 0, idx );
}

/**
 * Error thrown by the data-layer fetchers when WPCOM (via the bridge)
 * responds with a known error code. Consumers branch on `code` to pick
 * the right user-facing message.
 */
export class ApiError extends Error {
	public readonly code: string;
	public readonly data?: unknown;

	constructor( code: string, message: string, data?: unknown ) {
		super( message );
		this.name = 'ApiError';
		this.code = code;
		this.data = data;
	}
}

/**
 * Thin wrapper around `@wordpress/api-fetch` that re-throws bridge errors
 * as `ApiError` so React Query's onError handlers can branch on `code`.
 *
 * Options are typed `APIFetchOptions< true >` — the parsing variant —
 * because every fetcher here wants the decoded JSON body rather than the
 * raw `Response`. `Parameters< typeof apiFetch >[ 0 ]` would widen the
 * `parse` generic to `boolean`, which apiFetch's overload then refuses.
 *
 * @param options - apiFetch options.
 * @return The decoded JSON response.
 */
export async function apiCall< T >( options: APIFetchOptions< true > ): Promise< T > {
	try {
		return await apiFetch< T >( options );
	} catch ( raw ) {
		const err = raw as { code?: string; message?: string; data?: unknown };
		throw new ApiError(
			typeof err.code === 'string' ? err.code : 'unknown',
			typeof err.message === 'string' ? err.message : 'Request failed',
			err.data
		);
	}
}
