/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export type PromoteOnSimpleResult = {
	guid: string;
	mediaId: number;
};

type WpcomPromoteResponse = {
	guid: string;
	media_id: number;
	// Present (true) when the attachment was already on VideoPress and the
	// endpoint reported success idempotently instead of re-promoting.
	already_videopress?: boolean;
};

/**
 * Promote a local attachment in-process on WordPress.com Simple. The file
 * already lives on WordPress.com storage, so there is no chunked upload to
 * walk: a single POST creates the videos-table row and enqueues the
 * transcode. Promotion is in-place — the attachment keeps its id (no
 * sibling attachment is created), and shows up as a processing VideoPress
 * video on the next refetch.
 *
 * Shared by the dashboard library's promote flow and the VideoPress block's
 * media-library picker: `videopress/v1` upload routes never reach Simple's
 * REST dispatcher (the public-api router 404s them), so every surface that
 * turns an existing attachment into a VideoPress video must use this
 * endpoint there.
 *
 * @param attachmentId - The numeric or string WordPress attachment ID.
 * @return The VideoPress GUID and (unchanged) media post ID.
 */
export async function promoteOnSimple(
	attachmentId: string | number
): Promise< PromoteOnSimpleResult > {
	let result: WpcomPromoteResponse;
	try {
		result = await apiFetch< WpcomPromoteResponse >( {
			path: `/wpcom/v2/videopress/promote/${ attachmentId }`,
			method: 'POST',
		} );
	} catch ( err ) {
		// apiFetch rejects REST errors as plain { code, message } objects;
		// normalize to Error so callers can rely on `.message` when
		// reporting the failure.
		if ( err instanceof Error ) {
			throw err;
		}
		const message = ( err as { message?: string } )?.message;
		throw new Error(
			typeof message === 'string' && message !== ''
				? message
				: 'Failed to promote video to VideoPress.',
			{ cause: err }
		);
	}
	return { guid: result.guid, mediaId: result.media_id };
}
