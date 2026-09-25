import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { EDITS_QUERY_KEY } from './use-video-edits';
import type { SaveEditsResponse, VideoEdits } from '../types/edits';

/**
 * Retry stored instructions against the failed job the user actually saw.
 * @return The retry mutation.
 */
export function useRetryVideoProcessing() {
	const client = useQueryClient();
	return useMutation< SaveEditsResponse, Error, { guid: string; jobId: string } >( {
		mutationFn: ( { guid, jobId } ) =>
			apiFetch( {
				path: `/wpcom/v2/videopress/${ guid }/edits/retry`,
				method: 'POST',
				data: { job_id: jobId },
			} ),
		onSuccess: ( response, { guid } ) => {
			client.setQueryData< VideoEdits >( [ EDITS_QUERY_KEY, guid ], previous =>
				previous ? { ...previous, can_retry: false, job: response.job } : previous
			);
			return client.invalidateQueries( { queryKey: [ EDITS_QUERY_KEY, guid ] } );
		},
	} );
}
