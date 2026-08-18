import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
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
 * Truncating is a WPCOM-side requirement, not a local one — no route in
 * this package matches the id against `\d+`. Where the two remaining
 * callers stand:
 *
 * `fetchFileTree` needs it. It sends the id in the body as `rewind_id`,
 * and the bridge forwards that to WPCOM as `backup_id`, which is an
 * integer identifier there.
 *
 * `initiateRestore` still calls it, but only because it targets the v1
 * activity-log route with the id in the *path*. That is a temporary
 * arrangement: the v2 restore route takes the id in the body, in full,
 * and the call moves with it when it is repointed. Note the Jetpack
 * route it goes through already accepts a decimal, so the truncation is
 * not protecting anything.
 *
 * Download no longer calls it at all: `/rewind/downloads` takes the id
 * in the body and truncating it there addresses a different backup than
 * the reader picked.
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
 * Serialize a restore/download category checklist for WPCOM, refusing an
 * empty one.
 *
 * Two hazards, and the single place both are answered.
 *
 * **The shape.** WPCOM selects the enabled categories with a **loose**
 * comparison, so a JSON array of names does not mean what it looks like:
 * every name compares equal, and what comes back out is the array's own
 * integer indices. `[ "themes" ]` becomes `[ 0 ]` and `[ "themes",
 * "plugins" ]` becomes `[ 0, 1 ]`, which are then treated as category
 * names. An emptiness check would never catch it, because the list is not
 * empty. The object form is therefore the only safe spelling, and only
 * `true` entries are included so the result never depends on that loose
 * comparison.
 *
 * **The empty case.** The bodies must always *name* what they want. An
 * absent `types` is not a request for nothing — it is WPCOM's shorthand
 * for all six categories ("omit it for everything", in the contract's
 * words), so a checklist with every box cleared would submit the full
 * archive on the download side and a full destructive restore on the
 * other. That is the exact inverse of what the reader asked for, and it
 * is silent: the request succeeds.
 *
 * The v2 restore route rejects a supplied-but-empty `types` and the
 * downloads route does not, so this cannot be left to the server. Both
 * screens also disable their submit button, but the button is not where
 * the danger is — a future caller reaching these functions directly gets
 * the same protection here.
 *
 * @param  items - The category checklist.
 * @throws {ApiError} When no category is selected.
 * @return The object form, always naming at least one category.
 */
export function requireTypes( items: Record< string, boolean > ): Record< string, true > {
	const selected: Record< string, true > = {};
	for ( const key of Object.keys( items ) ) {
		if ( items[ key ] ) {
			selected[ key ] = true;
		}
	}

	if ( ! Object.keys( selected ).length ) {
		throw new ApiError(
			'no_types_selected',
			__( 'Select at least one item to continue.', 'jetpack-backup-pkg' )
		);
	}

	return selected;
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
