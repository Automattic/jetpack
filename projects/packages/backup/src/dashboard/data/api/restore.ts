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
 * One row of `GET /jetpack/v4/restores` — the last ten restores, any state.
 *
 * Deliberately only the two fields the recovery match needs. The rows
 * also carry a `status`, and it is not the status route's vocabulary:
 * WordPress.com's docblock for the collection claims `finished/started/
 * fail` while its own consumer matches `running`. Nothing here reads it,
 * and mapping a second, differently-spelled status enum would invite
 * something to.
 */
export type RecentRestore = {
	restore_id: number;
	rewind_id: string;
};

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
		} ) )
		.filter( row => row.restore_id > 0 );
}
