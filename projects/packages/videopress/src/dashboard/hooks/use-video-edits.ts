import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useRef } from 'react';
import { FILMSTRIP_QUERY_KEY } from './use-filmstrip';
import { LIBRARY_QUERY_KEY, nextProcessingPoll, LIBRARY_POLL_INTERVAL_MS } from './use-library';
import type { ProcessingPollAnchor } from './use-library';
import type { VideoEdits } from '../types/edits';

export const EDITS_QUERY_KEY = 'videopress-edits';
export const EDITS_POLL_INTERVAL_MS = LIBRARY_POLL_INTERVAL_MS;

/**
 * Fetch committed edits and poll pending jobs within the library's time limit.
 *
 * @param guid - The VideoPress GUID.
 * @return The edits query state and a manual refetch callback.
 */
export function useVideoEdits( guid: string ) {
	const client = useQueryClient();
	const processingStartRef = useRef< ProcessingPollAnchor | null >( null );
	const query = useQuery< VideoEdits >( {
		queryKey: [ EDITS_QUERY_KEY, guid ],
		queryFn: () => apiFetch< VideoEdits >( { path: `/wpcom/v2/videopress/${ guid }/edits` } ),
		enabled: Boolean( guid ),
		refetchInterval: q => {
			const job = q.state.data?.job;
			const { anchor, interval } = nextProcessingPoll(
				processingStartRef.current,
				job?.status === 'processing' ? [ `${ guid }:${ job.id }` ] : [],
				Date.now()
			);
			processingStartRef.current = anchor;
			return interval;
		},
		refetchOnWindowFocus: q => ( q.state.data?.job?.status === 'processing' ? 'always' : false ),
	} );

	const jobId = query.data?.job?.id;
	const jobStatus = query.data?.job?.status;
	useEffect( () => {
		if ( jobStatus === 'complete' || jobStatus === 'failed' ) {
			void client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
			void client.invalidateQueries( { queryKey: [ FILMSTRIP_QUERY_KEY, guid ] } );
		}
	}, [ client, guid, jobId, jobStatus ] );

	return {
		edits: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
	};
}
