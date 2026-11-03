import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { EDITS_QUERY_KEY } from './use-video-edits';
import type { SaveEditsResponse, VideoEdits } from '../types/edits';

export type RestoreOriginalVars = {
	guid: string;
};

/**
 * Restore the original and immediately expose its pending job to other controls.
 *
 * @return A mutation accepting the video GUID.
 */
export function useRestoreOriginal() {
	const client = useQueryClient();
	return useMutation< SaveEditsResponse, Error, RestoreOriginalVars >( {
		mutationFn: ( { guid } ) =>
			apiFetch< SaveEditsResponse >( {
				path: `/wpcom/v2/videopress/${ guid }/edits`,
				method: 'DELETE',
			} ),
		onSuccess: ( data, vars ) => {
			client.setQueryData< VideoEdits >( [ EDITS_QUERY_KEY, vars.guid ], previous =>
				previous ? { ...previous, job: data.job } : previous
			);
			return client.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, vars.guid ] } );
		},
	} );
}
