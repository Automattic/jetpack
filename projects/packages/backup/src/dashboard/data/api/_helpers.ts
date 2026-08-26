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
 * this package matches the id against `\d+`.
 *
 * `fetchFileTree` is the only caller left, and it needs this: it sends
 * the id in the body as `rewind_id`, and the bridge forwards that to
 * WPCOM as `backup_id`, which is an integer identifier there.
 *
 * Neither mutation calls it any more. Both `/rewind/downloads` and
 * `/rewind/restores` take the id in the body in full, and truncating it
 * for either addresses a different backup than the reader picked —
 * download stopped in #51295, restore in #51338.
 *
 * Use `isValidRewindId` in `types/rewind-id` to check an id from the
 * URL; this one assumes a well-formed id and only reshapes it.
 *
 * @param rewindId - Raw rewind id, possibly with a decimal suffix.
 * @return The integer-seconds portion only.
 */
export function toIntRewindId( rewindId: string ): string {
	const idx = rewindId.indexOf( '.' );
	return idx === -1 ? rewindId : rewindId.slice( 0, idx );
}

/**
 * Error thrown by the data-layer fetchers when a request fails.
 *
 * `code` is the bridge's own code for the operation, and every failure of
 * one operation carries the same one — all three ways a restore can fail
 * to start are `restore_initiate_failed` — so it names what failed and
 * never why. Nothing branches on it, and nothing should: the parts that
 * carry a verdict live on `data`, which is where both
 * `isAmbiguousFailure` and `upstreamMessage` read. It is kept because it
 * is the field `apiFetch` rejections already have, and because it names
 * the operation in a bug report.
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
 * Statuses that mean the request may have been carried out even though
 * we never saw a usable answer.
 *
 * A gateway timeout is not a refusal. WordPress.com may have accepted
 * and queued the work and only the reply went missing, which for a
 * destructive operation is the difference between "try again" and
 * "start a second one".
 */
const AMBIGUOUS_STATUSES = new Set( [ 408, 502, 503, 504 ] );

/**
 * Whether a failure leaves the outcome genuinely unknown.
 *
 * The question is not "did something go wrong" but "did our code get far
 * enough to give a verdict". Only a failure the bridge itself shaped
 * carries one, and every such failure carries a `data.status`; the
 * bridges give every failure of one operation the same code — all three
 * initiate failures are `restore_initiate_failed` — so the code cannot
 * tell them apart, but the presence of a verdict can.
 *
 * So the default is *ambiguous*, and a failure has to earn its way out.
 * That inversion matters: the hop the bridges describe is site →
 * WordPress.com, but the request also crosses browser → site, and that
 * hop fails in shapes carrying no `data` at all — `fetch_error` when the
 * request never completes, `invalid_json` when a proxy answers with an
 * HTML gateway page. The second is the dangerous one and is not exotic:
 * initiate is a blocking `wp_remote_post`, so a site whose proxy times
 * out before WordPress.com replies returns that page *after* the restore
 * has been queued. Read as a plain error, it offered the retry that
 * starts a second concurrent restore.
 *
 * The one exception is knowable rather than assumed. If the browser
 * reports no network, the request did not leave it, so nothing can have
 * started. `navigator.onLine` is unreliable when true and reliable when
 * false — which is the only direction relied on here — and it spares the
 * reader a five-minute wait for the most common failure there is.
 *
 * @param error - The rejection from `apiCall`.
 * @return True when the caller must not assume nothing happened.
 */
export function isAmbiguousFailure( error: unknown ): boolean {
	if ( ! ( error instanceof ApiError ) ) {
		return false;
	}

	// Proof the request never left, rather than an assumption about it.
	if ( typeof navigator !== 'undefined' && navigator.onLine === false ) {
		return false;
	}

	const data = error.data as { status?: unknown; transport?: unknown } | undefined;
	if ( data?.transport ) {
		return true;
	}
	if ( typeof data?.status === 'number' ) {
		// A verdict from the bridge. Ambiguous only for the statuses that
		// mean the answer itself went missing.
		return AMBIGUOUS_STATUSES.has( data.status );
	}

	// No verdict at all — the failure happened before our code could give
	// one, so the outcome is unknown.
	return true;
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
 * The reason WordPress.com gave, as the bridges forward it.
 *
 * Both halves are optional and only one usually arrives: `code` when
 * WordPress.com refused with a `WP_Error`, `message` when the refusal was
 * prose (see `Rest_Controller::upstream_reason()`, which decides which is
 * which). Neither is ever rendered.
 */
type UpstreamReason = { code?: string; message?: string };

/**
 * The code WordPress.com refused with, when the bridge forwarded one.
 *
 * @param data - The `data` from a bridge failure.
 * @return The upstream code, or an empty string when there is none.
 */
function upstreamCode( data: unknown ): string {
	const wpcom = ( data as { wpcom?: UpstreamReason } | undefined )?.wpcom;
	return typeof wpcom?.code === 'string' ? wpcom.code : '';
}

/**
 * Copy for the WordPress.com refusals a reader can do something about.
 *
 * This is the half of the change that the bridges' new `data.wpcom` is
 * for. Without a branch here, forwarding the reason would improve
 * nothing anyone sees: the three surfaces that report a failure —
 * `<QueryError>`, `<CapabilitiesErrorScreen>` and the error boundary —
 * render `error.message` and nothing else, and the message they were
 * getting is the bridge's single line per operation. "Could not fetch
 * site capabilities." reads the same whether the plan lapsed or the
 * token did.
 *
 * Only recognised codes are translated. Everything else keeps the
 * bridge's generic line rather than being handed the upstream text,
 * which is unbounded English written for whoever reads the logs — it
 * still travels in `data.wpcom` for them.
 *
 * A `switch` rather than a lookup table so each `__()` runs when it is
 * needed. At module scope they would all run before this bundle's locale
 * data has finished loading, and every one of them would be evaluated in
 * English and cached that way.
 *
 * @param code - The code WordPress.com refused with.
 * @return Translated copy, or null when there is nothing better to say.
 */
function upstreamMessage( code: string ): string | null {
	switch ( code ) {
		case 'no_connected_jetpack':
			// Deliberately the same msgid the bridge's own `not_connected`
			// uses. The reader is being told the same fact by a different
			// route, and reusing it means the string is already translated.
			return __( 'This site is not connected to Jetpack.', 'jetpack-backup-pkg' );
		case 'authorization_required':
			return __(
				'Your WordPress.com account is not allowed to manage this site.',
				'jetpack-backup-pkg'
			);
		case 'rewind_error':
			return __(
				'The backup service ran into a problem. Try again in a few minutes, and contact support if it keeps happening.',
				'jetpack-backup-pkg'
			);
		default:
			return null;
	}
}

/**
 * Thin wrapper around `@wordpress/api-fetch` that re-throws every failure
 * as an `ApiError`, so one place decides what a failed request says.
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
		const fallback = __( 'Request failed', 'jetpack-backup-pkg' );
		const bridgeMessage = typeof err.message === 'string' ? err.message : fallback;
		throw new ApiError(
			typeof err.code === 'string' ? err.code : 'unknown',
			upstreamMessage( upstreamCode( err.data ) ) ?? bridgeMessage,
			err.data
		);
	}
}
