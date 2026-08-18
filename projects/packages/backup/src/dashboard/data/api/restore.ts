import { apiCall, apiPath, requireTypes, toIntRewindId } from './_helpers';
import type { RestoreItems } from '../../types/restore';

export type InitiateRestoreResponse = {
	id: number;
};

export type RestoreStatusResponse = {
	id: number;
	status: 'queued' | 'in-progress' | 'finished' | 'failed' | string;
	progress: number;
	rewind_id: string;
	error_code: string;
	message: string;
};

/**
 * Start a restore for the given backup point.
 *
 * Shares `requireTypes` with the download call so both emit the object
 * form; see that helper for why a JSON array is never safe here, and why
 * an empty checklist is refused rather than sent as an omitted key.
 *
 * That refusal matters most on this call. An absent `types` means all six
 * categories upstream, so a cleared checklist would overwrite the live
 * site with exactly the parts the reader excluded — the one mistake here
 * that cannot be undone.
 *
 * Note this still targets the v1 activity-log route, which discards
 * Jetpack user tokens and therefore always answers 401. Repointing it at
 * the v2 restore routes is separate work.
 *
 * @param rewindId - The backup's rewind id.
 * @param types    - Which categories to restore (themes/plugins/roots/contents/sqls/uploads).
 * @return The restore id.
 */
export async function initiateRestore(
	rewindId: string,
	types: RestoreItems
): Promise< InitiateRestoreResponse > {
	return apiCall< InitiateRestoreResponse >( {
		path: apiPath( `/rewind/to/${ toIntRewindId( rewindId ) }` ),
		method: 'POST',
		data: { types: requireTypes( types ) },
	} );
}

/**
 * Poll restore status.
 *
 * @param restoreId - The restore id returned by `initiateRestore`.
 * @return The current restore state.
 */
export async function fetchRestoreStatus( restoreId: number ): Promise< RestoreStatusResponse > {
	return apiCall< RestoreStatusResponse >( {
		path: apiPath( `/rewind/restore/${ restoreId }/status` ),
	} );
}
