import { isConnectionAttributedFailure } from '../../src/client/hooks/use-resumable-uploader';
import type { UploadItem } from '../../src/dashboard/hooks/use-upload';
import type { UploadFailureReason } from '../../src/dashboard/types/library';

/**
 * Decide what a failed upload should tell the user about its cause.
 *
 * The upload token is created by a blog-token-signed request to WordPress.com
 * (Ajax::wp_ajax_videopress_get_upload_jwt()). The dashboard only checks whether the
 * user is connected, so a broken blog token or blocked outbound requests can pass
 * that check and still fail here. Historically, the user would only see “Upload failed.”
 *
 * The rule itself lives with the error code, in `isConnectionAttributedFailure()`.
 *
 * @param {UploadItem} item               - The queue item to classify. One that has not failed is always 'other'.
 * @param {boolean}    hasConnectionError - Whether the connection store is reporting an error.
 * @return {UploadFailureReason} What to attribute the failure to.
 */
export function classifyUploadFailure(
	item: Pick< UploadItem, 'status' | 'errorCode' >,
	hasConnectionError: boolean
): UploadFailureReason {
	// The status guard is this caller's own: a queue item can be read at any status,
	// while the block editor's equivalent only ever renders after a failure.
	const attributable =
		item.status === 'failed' && isConnectionAttributedFailure( item.errorCode, hasConnectionError );

	return attributable ? 'connection' : 'other';
}
