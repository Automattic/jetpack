import { apiCall, apiPath, requireTypes } from './_helpers';
import type { RestoreItems } from '../../types/restore';

/**
 * Lifecycle of a restore, as the bridge reports it.
 *
 * Deliberately not WPCOM's own vocabulary. Upstream says
 * `running | success | fail | aborted | success-with-errors`; the bridge
 * maps those to these, reports a not-yet-visible restore as `queued`, and
 * anything it does not recognise as `unknown` rather than guessing. See
 * `Restore_Bridge::STATUS_MAP`.
 *
 * `unknown` exists so a status WPCOM adds later degrades into "keep
 * asking for a while" instead of a progress bar frozen at whatever
 * percentage happened to arrive first.
 */
export type RestoreStatus =
	| 'queued'
	| 'running'
	| 'finished'
	| 'finished-with-errors'
	| 'failed'
	| 'aborted'
	| 'unknown';

export type InitiateRestoreResponse = {
	/**
	 * Null when WPCOM accepted the restore without echoing an id back,
	 * which is a normal outcome rather than a failure — VaultPress does
	 * not reliably return one. The id is then recovered from the restores
	 * collection; see `fetchRecentRestores`.
	 */
	id: number | null;
	rewind_id: string;
};

export type RestoreStatusResponse = {
	id: number;
	status: RestoreStatus;
	/** 0–100. */
	progress: number;
	rewind_id: string;
	/** Machine identifier such as `checksum_mismatch`. Never shown to users. */
	error_code: string;
	message: string;
};

/**
 * Status spellings from the restores collection that we are confident
 * mean the restore is over.
 *
 * The collection's `status` is *not* the status route's vocabulary:
 * WordPress.com's docblock for it claims `finished/started/fail` while
 * its own consumer matches `running`, and the standalone plugin's legacy
 * Admin screen reads `finished`. Rather than map a second,
 * differently-spelled enum into ours — which would invite something to
 * treat it as authoritative — this quarantines it as a single boolean,
 * computed once, at the edge.
 *
 * An unrecognised spelling counts as *not* settled, so the row stays
 * adoptable. That is the direction that fails least badly: the rows are
 * ranked newest-first, so the restore we just started is the one we
 * reach anyway, and a stale adoption self-corrects as soon as the real
 * one appears. Guessing the other way would make an unknown spelling of
 * "running" permanently unrecoverable.
 */
const SETTLED_ROW_STATUSES = new Set( [
	'finished',
	'success',
	'success-with-errors',
	'fail',
	'failed',
	'aborted',
	'error',
] );

/**
 * One row of `GET /jetpack/v4/restores` — the last ten restores, any state.
 *
 * `when` is WordPress.com's own ISO-8601 timestamp and is compared only
 * against other rows', never against the browser's clock: a browser
 * minutes ahead of the server would otherwise reject the restore it had
 * just started, and recovery would fail for the whole session.
 *
 * `settled` is the quarantined reading of the row's `status` — see
 * `SETTLED_ROW_STATUSES`. The raw spelling is deliberately not carried
 * any further than this file.
 */
export type RecentRestore = {
	restore_id: number;
	rewind_id: string;
	when: string;
	settled: boolean;
};

/** Statuses that mean the restore is still going, or might be. */
const LIVE_STATUSES: RestoreStatus[] = [ 'queued', 'running', 'unknown' ];

/**
 * Whether a status reading ends the poll.
 *
 * @param status - The status the bridge reported, if any.
 * @return True when there is nothing left to wait for.
 */
export function isTerminal( status: RestoreStatus | undefined ): boolean {
	return status !== undefined && ! LIVE_STATUSES.includes( status );
}

/**
 * Whether two rewind ids name the same backup.
 *
 * Adopting the wrong id would report someone else's restore as this one,
 * so this stays an equality test and never a prefix or integer-part
 * match: two restores of the same backup share an integer part.
 *
 * What it does tolerate is formatting. A rewind id is a unix timestamp
 * with a decimal suffix, and the value in `recent_restores[]` has been
 * round-tripped through VaultPress rather than echoed back by
 * WordPress.com — so a trailing zero gained or lost (`…613.9425` vs
 * `…613.94250`) would defeat a strict string comparison for two
 * representations of the same instant. Comparing them as numbers as well
 * closes that without widening what counts as a match.
 *
 * @param candidate - A rewind id from the restores collection.
 * @param target    - The rewind id this screen submitted.
 * @return True when both name the same backup.
 */
function sameRewindId( candidate: string, target: string ): boolean {
	if ( ! candidate || ! target ) {
		return false;
	}
	if ( candidate === target ) {
		return true;
	}
	const a = Number( candidate );
	const b = Number( target );
	return Number.isFinite( a ) && Number.isFinite( b ) && a === b;
}

/**
 * The restore in this collection that best answers "the one for this
 * backup that is still going", or null when there isn't one.
 *
 * Two rules, and the order matters.
 *
 * A settled row is never adopted. The same backup point can be restored
 * more than once, and a plain first-match took an earlier, *completed*
 * restore of it — whose status route then answered `finished`, so the
 * screen announced "Restore complete." while the real restore was still
 * overwriting the site.
 *
 * What remains is ranked newest-first by `when`. That comparison is
 * between two WordPress.com timestamps and never against the browser's
 * clock, so a machine whose time is minutes out still recovers its own
 * restore. A row with no usable `when` sorts last rather than being
 * dropped: it is still a candidate, just the weakest one.
 *
 * `rewindId` is null when the caller does not care which backup is being
 * restored — the cold-mount case. A restore of any backup overwrites the
 * same live site, so a second one is wrong whichever point it came from,
 * and the screen has to adopt what is running rather than arm a button
 * beside it.
 *
 * @param rows     - The restores collection, as the bridge returned it.
 * @param rewindId - The rewind id to match, or null for any backup.
 * @return The best candidate, or null.
 */
export function pickLiveRestore(
	rows: RecentRestore[],
	rewindId: string | null
): RecentRestore | null {
	const candidates = rows
		.filter(
			row => ! row.settled && ( rewindId === null || sameRewindId( row.rewind_id, rewindId ) )
		)
		.sort( ( a, b ) => {
			const at = Date.parse( a.when );
			const bt = Date.parse( b.when );
			const av = Number.isNaN( at ) ? -Infinity : at;
			const bv = Number.isNaN( bt ) ? -Infinity : bt;
			// Restore ids are handed out in order, so they break a tie
			// between two rows stamped in the same second.
			return bv === av ? b.restore_id - a.restore_id : bv - av;
		} );

	return candidates[ 0 ] ?? null;
}

/**
 * Start a restore for the given backup point.
 *
 * Shares `requireTypes` with the download call so both emit the object
 * form; see that helper for why a JSON array is never safe here, and why
 * an empty checklist is refused rather than sent as an omitted key.
 *
 * The rewind id goes in the body, in full. It is not truncated and not
 * carried in the upstream path: WPCOM passes it to VaultPress as the
 * backup's timestamp, so dropping the decimal addresses a different
 * backup than the reader picked. It stays in *our* route's path only
 * because the client keys its poll cache on it.
 *
 * @param rewindId - The backup's rewind id, in full.
 * @param types    - Which categories to restore (themes/plugins/roots/contents/sqls/uploads).
 * @return The restore id, which may be null while WPCOM has not named one.
 */
export async function initiateRestore(
	rewindId: string,
	types: RestoreItems
): Promise< InitiateRestoreResponse > {
	return apiCall< InitiateRestoreResponse >( {
		path: apiPath( `/rewind/to/${ rewindId }` ),
		method: 'POST',
		data: { types: requireTypes( types ) },
	} );
}

/**
 * Poll restore status.
 *
 * @param restoreId - The restore id.
 * @return The current restore state.
 */
export async function fetchRestoreStatus( restoreId: number ): Promise< RestoreStatusResponse > {
	return apiCall< RestoreStatusResponse >( {
		path: apiPath( `/rewind/restore/${ restoreId }/status` ),
	} );
}

/**
 * The site's ten most recent restores, in any state.
 *
 * Reads `GET /jetpack/v4/restores`, which is registered unconditionally
 * and signed with the blog token — so it answers for any admin, not only
 * the one who started the restore.
 *
 * Used to recover a restore id that WPCOM accepted but did not return.
 * Note the route follows the legacy convention of answering a non-200
 * from WPCOM with a bare `null`, which WordPress serves as HTTP 200 — so
 * this resolves rather than rejecting, and the empty list it returns in
 * that case means "could not read", not "no restores".
 *
 * @return The recent restores, or an empty list when the read failed.
 */
export async function fetchRecentRestores(): Promise< RecentRestore[] > {
	const data = await apiCall< unknown >( {
		path: apiPath( '/restores' ),
	} );

	if ( ! Array.isArray( data ) ) {
		return [];
	}

	return data
		.filter( ( row ): row is Record< string, unknown > => !! row && typeof row === 'object' )
		.map( row => ( {
			restore_id: Number( row.restore_id ) || 0,
			rewind_id: typeof row.rewind_id === 'string' ? row.rewind_id : String( row.rewind_id ?? '' ),
			when: typeof row.when === 'string' ? row.when : '',
			settled:
				typeof row.status === 'string' && SETTLED_ROW_STATUSES.has( row.status.toLowerCase() ),
		} ) )
		.filter( row => row.restore_id > 0 );
}
