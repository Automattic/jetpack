import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef } from 'react';
import { LIBRARY_QUERY_KEY, nextProcessingPoll } from './use-library';
import { EditsConflictError } from './use-save-video-edits';
import type { ProcessingPollAnchor } from './use-library';
import type { SaveVideoEditsVars } from './use-save-video-edits';
import type { EditsJob } from '../types/edits';

export const VIDEO_COPY_QUERY_KEY = 'videopress-video-copy';

/** A request rejected before the service could create a copy. */
export class VideoCopyRejectedError extends Error {
	constructor(
		public code: string,
		message?: string
	) {
		super( message || __( 'The new video could not be created.', 'jetpack-videopress-pkg' ) );
		this.name = 'VideoCopyRejectedError';
	}
}

export type SaveVideoCopyVars = SaveVideoEditsVars & {
	/** Reuse this identifier when retrying an uncertain request. */
	requestId: string;
	title?: string;
};

export type SaveVideoCopyResponse = {
	source_guid: string;
	request_id: string;
	/** Destination identifiers appear once its attachment has been created. */
	guid: string | null;
	attachment_id: number | null;
	job: EditsJob;
};

/**
 * Create a separate edited video without changing the source's edit session.
 *
 * @return The copy mutation; callers retain the request ID for retries and polling.
 */
export function useSaveVideoCopy() {
	const client = useQueryClient();
	return useMutation< SaveVideoCopyResponse, Error, SaveVideoCopyVars >( {
		mutationFn: async ( { guid, baseRevision, operations, requestId, title } ) => {
			try {
				return await apiFetch< SaveVideoCopyResponse >( {
					path: `/wpcom/v2/videopress/${ guid }/edits/copy`,
					method: 'POST',
					data: {
						base_revision: baseRevision,
						operations,
						request_id: requestId,
						...( title === undefined ? {} : { title } ),
					},
				} );
			} catch ( error ) {
				const restError = error as {
					code?: string;
					message?: string;
					data?: { current_revision?: number; status?: number };
				};
				if ( restError?.code === 'edits_conflict' ) {
					throw new EditsConflictError(
						restError.message,
						restError.data?.current_revision ?? null
					);
				}
				if (
					[ 400, 401, 403, 404, 405, 413, 422 ].includes( restError?.data?.status ?? 0 ) ||
					[ 'copy_source_unavailable', 'copy_authorization_unavailable' ].includes(
						restError?.code ?? ''
					)
				) {
					throw new VideoCopyRejectedError( restError.code ?? 'copy_rejected', restError.message );
				}
				throw error;
			}
		},
		onSuccess: ( response, { guid, requestId } ) => {
			client.setQueryData( [ VIDEO_COPY_QUERY_KEY, guid, requestId ], response );
		},
	} );
}

/**
 * Follow a copy job until processing finishes, keeping the library current.
 *
 * @param guid      - The source video GUID.
 * @param requestId - The accepted or uncertain copy request, or null before saving.
 * @return The copy job query, including retry and error state.
 */
export function useVideoCopyStatus( guid: string, requestId: string | null ) {
	const client = useQueryClient();
	const processingStartRef = useRef< ProcessingPollAnchor | null >( null );
	const query = useQuery< SaveVideoCopyResponse >( {
		queryKey: [ VIDEO_COPY_QUERY_KEY, guid, requestId ],
		queryFn: () =>
			apiFetch< SaveVideoCopyResponse >( {
				path: `/wpcom/v2/videopress/${ guid }/edits/copy/${ requestId }`,
			} ),
		enabled: Boolean( guid && requestId ),
		refetchInterval: state => {
			const { anchor, interval } = nextProcessingPoll(
				processingStartRef.current,
				state.state.data?.job.status === 'processing' ? [ `${ guid }:${ requestId }` ] : [],
				Date.now()
			);
			processingStartRef.current = anchor;
			return interval;
		},
		refetchOnWindowFocus: state => state.state.data?.job.status === 'processing',
	} );
	const attachmentId = query.data?.attachment_id;
	const status = query.data?.job.status;
	useEffect( () => {
		if ( attachmentId ) {
			void client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		}
	}, [ client, attachmentId, status ] );
	return query;
}
