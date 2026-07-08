import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import type { VideoEdits } from '../types/edits';

/** Root query key for the per-video edits state. */
export const EDITS_QUERY_KEY = 'videopress-edits';

/** Milliseconds between refetches while an edit job is processing. */
export const EDITS_POLL_INTERVAL_MS = 2000;

/**
 * Fetch and cache the edit state for one video from
 * /wpcom/v2/videopress/{guid}/edits.
 *
 * While the server reports a processing job the query re-fetches every 2s
 * (mirroring useVideo's isProcessing polling), so a save's transcode job is
 * observed through to complete/failed without a manual reload.
 *
 * @param guid - The VideoPress GUID.
 * @return An object with the edits state, loading/error state, and the raw error.
 */
export function useVideoEdits( guid: string ) {
	const query = useQuery< VideoEdits >( {
		queryKey: [ EDITS_QUERY_KEY, guid ],
		queryFn: () => apiFetch< VideoEdits >( { path: `/wpcom/v2/videopress/${ guid }/edits` } ),
		enabled: Boolean( guid ),
		// Re-fetch every 2s while a save/restore job is still transcoding so
		// the new revision lands without a manual reload.
		refetchInterval: q =>
			q.state.data?.job?.status === 'processing' ? EDITS_POLL_INTERVAL_MS : false,
	} );

	return {
		edits: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
	};
}
