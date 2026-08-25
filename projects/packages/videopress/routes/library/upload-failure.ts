import { UPLOAD_TOKEN_ERROR_CODE } from '../../src/client/hooks/use-resumable-uploader';
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
 * Both checks are needed, because each rules out a different mistake.
 *
 * @param {UploadItem} item               - The failed queue item.
 * @param {boolean}    hasConnectionError - Whether the connection store is reporting an error.
 * @return {UploadFailureReason} What to attribute the failure to.
 */
export function classifyUploadFailure(
	item: Pick< UploadItem, 'status' | 'errorCode' >,
	hasConnectionError: boolean
): UploadFailureReason {
	const failedOnToken = item.status === 'failed' && item.errorCode === UPLOAD_TOKEN_ERROR_CODE;

	return failedOnToken && hasConnectionError ? 'connection' : 'other';
}
