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
 * `'1777035492.615'` → `'1777035492'`).
 *
 * **Only the file-browser URL family needs this.** Those routes match
 * `(?P<backup_id>\d+)`, so a fractional id 404s before WPCOM is reached.
 * The restore and download mutations are the opposite case: they take
 * the rewind id in the request *body*, in full, and truncating it there
 * addresses a different backup than the one the reader picked.
 *
 * @param rewindId - Raw rewind id, possibly with a decimal suffix.
 * @return The integer-seconds portion only.
 */
export function toIntRewindId( rewindId: string ): string {
	const idx = rewindId.indexOf( '.' );
	return idx === -1 ? rewindId : rewindId.slice( 0, idx );
}

/**
 * Serialize a restore/download category checklist for WPCOM.
 *
 * WPCOM parses `types` with `array_keys( $param, true )`, which compares
 * **loosely** — so a JSON array of names does not mean what it looks
 * like. `[ "themes" ]` matches `'themes' == true` and yields `[ 0 ]`,
 * and `[ "themes", "plugins" ]` yields `[ 0, 1 ]`: integer indices,
 * forwarded to VaultPress as if they were type names. An emptiness
 * check would never catch it, because the list is not empty.
 *
 * The object form is therefore the only safe spelling, and this is the
 * single place that builds it. Only `true` entries are included, so the
 * result never depends on that loose comparison.
 *
 * Returns `undefined` when nothing is selected. Callers must omit the
 * key entirely in that case rather than sending `{}` — the restore route
 * rejects any `types` value that names no type, and on the download side
 * an empty list would silently ask for nothing.
 *
 * @param items - The category checklist.
 * @return The object form, or undefined when no category is selected.
 */
export function serializeTypes(
	items: Record< string, boolean >
): Record< string, true > | undefined {
	const selected: Record< string, true > = {};
	for ( const key of Object.keys( items ) ) {
		if ( items[ key ] ) {
			selected[ key ] = true;
		}
	}
	return Object.keys( selected ).length ? selected : undefined;
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
