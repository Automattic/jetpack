import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { LIBRARY_QUERY_KEY } from './use-library';

type UploadStatusResponse = {
	status: 'new' | 'resume' | 'uploading' | 'complete' | 'uploaded' | 'error';
	error?: string;
	uploaded_details?: {
		guid: string;
		media_id: number;
		upload_src?: string;
	};
	// Returned for the `uploaded` (already-on-VideoPress) terminal status.
	uploaded_post_id?: number | string;
	uploaded_video_guid?: string;
};

export type UploadFromLibraryResult = {
	guid: string;
	mediaId: number;
};

/**
 * Recursively POST to `/videopress/v1/upload/{id}` until the endpoint
 * settles on `complete` or `error`. Each call is the pacing mechanism
 * — the server uploads one chunk per request and returns immediately
 * with an in-progress status when more work remains. Matches the
 * legacy `uploadFromLibrary()` semantics exactly.
 *
 * @param attachmentId - The numeric or string WordPress attachment ID.
 * @return The new VideoPress GUID and media post ID.
 */
async function uploadFromLibrary(
	attachmentId: string | number
): Promise< UploadFromLibraryResult > {
	const result = await apiFetch< UploadStatusResponse >( {
		path: `/videopress/v1/upload/${ attachmentId }`,
		method: 'POST',
	} );
	if ( result.status === 'complete' && result.uploaded_details ) {
		return {
			guid: result.uploaded_details.guid,
			mediaId: result.uploaded_details.media_id,
		};
	}
	// `uploaded` means the attachment had already been promoted to
	// VideoPress in a prior session. The library filter
	// (`videopress_hide_already_uploaded`) normally hides those rows;
	// this branch is a safety net for any zombie that slips through.
	if ( result.status === 'uploaded' && result.uploaded_video_guid ) {
		return {
			guid: result.uploaded_video_guid,
			mediaId: Number( result.uploaded_post_id ),
		};
	}
	if ( result.status === 'new' || result.status === 'resume' || result.status === 'uploading' ) {
		return uploadFromLibrary( attachmentId );
	}
	throw new Error( result.error ?? 'Unexpected upload status.' );
}

/**
 * Promote an existing local WordPress media attachment to a
 * VideoPress-hosted video by walking the chunked upload endpoint.
 * On success the library query is invalidated so the new VideoPress
 * item appears (in processing state, which the library's existing
 * 2s polling then resolves once the backend finishes transcoding).
 *
 * @return A react-query mutation.
 */
export function useUploadFromLibrary() {
	const client = useQueryClient();
	return useMutation< UploadFromLibraryResult, Error, string | number >( {
		mutationFn: uploadFromLibrary,
		onSuccess: () => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		},
	} );
}
