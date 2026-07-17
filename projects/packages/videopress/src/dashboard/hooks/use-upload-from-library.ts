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

export type UploadFromLibraryOptions = {
	/** Delay (ms) between polls and between transient-error retries. */
	delayMs?: number;
	/** Maximum total attempts before giving up. */
	maxAttempts?: number;
};

const DEFAULT_DELAY_MS = 500;
const DEFAULT_MAX_ATTEMPTS = 120; // ~1 minute at 500ms cadence.

const sleep = ( ms: number ): Promise< void > =>
	new Promise( resolve => {
		if ( ms <= 0 ) {
			resolve();
			return;
		}
		setTimeout( resolve, ms );
	} );

/**
 * Walk the `/videopress/v1/upload/{id}` endpoint until it settles on a
 * terminal status (`complete`, `uploaded`, `error`) or `maxAttempts` is
 * reached. Each in-progress response (`new` / `resume` / `uploading`)
 * triggers another POST after `delayMs`. Transient apiFetch failures are
 * also retried, counting against the same attempt budget. Matches the
 * legacy `uploadFromLibrary()` semantics but adds a cap so a stuck
 * backend can't lock the client in a tight loop.
 *
 * @param attachmentId - The numeric or string WordPress attachment ID.
 * @param options      - Optional polling cadence and retry cap.
 * @return The new VideoPress GUID and media post ID.
 */
export async function uploadFromLibrary(
	attachmentId: string | number,
	options: UploadFromLibraryOptions = {}
): Promise< UploadFromLibraryResult > {
	const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
	const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
	const path = `/videopress/v1/upload/${ attachmentId }`;

	let lastError: unknown;

	for ( let attempt = 0; attempt < maxAttempts; attempt += 1 ) {
		if ( attempt > 0 ) {
			await sleep( delayMs );
		}

		let result: UploadStatusResponse;
		try {
			result = await apiFetch< UploadStatusResponse >( { path, method: 'POST' } );
		} catch ( err ) {
			// Transient apiFetch failure — count against the attempt
			// budget and try again on the next iteration.
			lastError = err;
			continue;
		}

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
			// Keep polling.
			continue;
		}

		throw new Error( result.error ?? 'Unexpected upload status.' );
	}

	if ( lastError instanceof Error ) {
		throw lastError;
	}
	throw new Error( 'Upload from library timed out.' );
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
		mutationFn: id => uploadFromLibrary( id ),
		onSuccess: () => {
			client.invalidateQueries( { queryKey: [ LIBRARY_QUERY_KEY ] } );
		},
	} );
}
