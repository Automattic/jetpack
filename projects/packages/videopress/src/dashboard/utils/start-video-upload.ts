import { UploadTokenError } from '../../client/hooks/use-resumable-uploader';
import getMediaToken from '../../client/lib/get-media-token';
import resumableFileUploader from '../../client/lib/resumable-file-uploader';
import type { VideoMediaProps } from '../../client/lib/resumable-file-uploader/types';
import type { UploadAnalytics } from '../../client/lib/upload-analytics';

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
 * @param options.analytics    - Recorder retained across retries of the selected file.
 */
export async function startVideoUpload(
	file: File,
	{ onProgress, onSuccess, onError }: VideoUploadCallbacks,
	{ signal, analytics }: { signal?: AbortSignal; analytics?: UploadAnalytics } = {}
): Promise< void > {
	if ( signal?.aborted ) {
		return;
	}
	analytics?.start();
	const pause = () => analytics?.pause();
	signal?.addEventListener( 'abort', pause, { once: true } );
	let stage: 'token' | 'transfer' = 'token';
	try {
		const tokenData = await getMediaToken( 'upload-jwt' );
		if ( signal?.aborted ) {
			return;
		}
		if ( ! tokenData?.token ) {
			throw new UploadTokenError();
		}
		stage = 'transfer';
		resumableFileUploader( { file, tokenData, onProgress, onSuccess, onError, signal, analytics } );
	} catch ( error ) {
		if ( ! signal?.aborted ) {
			analytics?.fail( error, stage );
			onError( error );
		}
	} finally {
		signal?.removeEventListener( 'abort', pause );
	}
}
