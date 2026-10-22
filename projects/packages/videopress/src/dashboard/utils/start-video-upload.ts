import { UploadTokenError } from '../../client/hooks/use-resumable-uploader';
import getMediaToken from '../../client/lib/get-media-token';
import resumableFileUploader from '../../client/lib/resumable-file-uploader';
import type { VideoMediaProps } from '../../client/lib/resumable-file-uploader/types';

export type VideoUploadCallbacks = {
	onProgress: ( bytesSent: number, bytesTotal: number ) => void;
	onSuccess: ( media: VideoMediaProps ) => void;
	onError: ( error: unknown ) => void;
};

/**
 * Fetch an upload JWT and hand the file to the resumable uploader.
 *
 * Every failure reaches `onError`, a missing token included, so callers own one
 * failure path.
 *
 * @param file                 - The video to upload.
 * @param callbacks            - Progress, success and error handlers.
 * @param callbacks.onProgress - Receives the bytes sent so far and the total.
 * @param callbacks.onSuccess  - Receives the media the upload created.
 * @param callbacks.onError    - Receives the failure, a missing token included.
 * @param options              - Upload options.
 * @param options.signal       - Aborts the upload, one still waiting for its token included.
 */
export async function startVideoUpload(
	file: File,
	{ onProgress, onSuccess, onError }: VideoUploadCallbacks,
	{ signal }: { signal?: AbortSignal } = {}
): Promise< void > {
	try {
		const tokenData = await getMediaToken( 'upload-jwt' );
		if ( signal?.aborted ) {
			return;
		}
		if ( ! tokenData?.token ) {
			throw new UploadTokenError();
		}
		resumableFileUploader( { file, tokenData, onProgress, onSuccess, onError, signal } );
	} catch ( error ) {
		if ( ! signal?.aborted ) {
			onError( error );
		}
	}
}
