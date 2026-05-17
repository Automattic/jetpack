import { apiCall, apiPath, toIntRewindId } from './_helpers';
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
 * `types` maps directly to WPCOM's `types` payload (the keys match the
 * `RestoreItems` checklist). Sending `{}` means "restore everything".
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
		data: { types },
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
