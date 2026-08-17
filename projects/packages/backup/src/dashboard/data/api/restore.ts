import { apiCall, apiPath, serializeTypes, toIntRewindId } from './_helpers';
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
 * Shares `serializeTypes` with the download call so both emit the object
 * form; see that helper for why a JSON array is never safe here. An
 * unselected checklist sends no `types` at all rather than an empty one.
 *
 * Note this still targets the v1 activity-log route, which discards
 * Jetpack user tokens and therefore always answers 401. Repointing it at
 * the v2 restore routes is separate work — only the `types` serialization
 * is changed here, so restore and download share one spelling.
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
		data: { types: serializeTypes( types ) },
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
