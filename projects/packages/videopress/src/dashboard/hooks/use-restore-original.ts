import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { EDITS_QUERY_KEY } from './use-video-edits';
import type { SaveEditsResponse } from '../types/edits';

export type RestoreOriginalVars = {
	guid: string;
};

/**
 * Return a mutation that DELETEs /wpcom/v2/videopress/{guid}/edits, restoring
 * the original master (semantically a save with an empty operations list; the
 * revision still bumps).
 *
 * On success the edits query for the guid is invalidated so the refetch picks
 * up the restore job and polls it through to completion.
 *
 * @return A TanStack Query mutation whose mutateAsync accepts `{ guid }`.
 */
export function useRestoreOriginal() {
	const client = useQueryClient();
	return useMutation< SaveEditsResponse, Error, RestoreOriginalVars >( {
		mutationFn: ( { guid } ) =>
			apiFetch< SaveEditsResponse >( {
				path: `/wpcom/v2/videopress/${ guid }/edits`,
				method: 'DELETE',
			} ),
		onSuccess: ( _data, vars ) => {
			client.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, vars.guid ] } );
		},
	} );
}
