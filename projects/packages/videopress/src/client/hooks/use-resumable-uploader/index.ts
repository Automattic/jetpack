/**
 * External dependencies
 */
import { useState } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import resumableFileUploader from '../../lib/resumable-file-uploader';
import { UPLOAD_TOKEN_ERROR_CODE } from '../../lib/resumable-file-uploader/token-error';
export {
	UPLOAD_TOKEN_ERROR_CODE,
	UploadTokenError,
} from '../../lib/resumable-file-uploader/token-error';
import { VideoMediaProps } from '../../lib/resumable-file-uploader/types';
import type { ChangeEvent } from 'react';

const debug = debugFactory( 'videopress:use-resumable-uploader' );

/**
 * A failure as it reaches `onError` and the returned `error`.
 *
 * Always an `Error`, but the extras depend on where it came from: `code` on
 * failures raised here (see `UploadTokenError`), `originalResponse` on tus
 * transport failures. Consumers branch on both, so they are declared optional
 * rather than left off the type.
 */
export type ResumableUploadError = Error & {
	code?: string;
	originalResponse?: { getBody?: () => string };
};

/**
 * Whether a failed upload may be blamed on the Jetpack connection.
 *
 * A missing token means the upload never reached WordPress.com, but not why; only
 * a connection error alongside it justifies naming the connection. Both checks are
 * needed, because each rules out a different mistake. Shared so the dashboard's
 * `classifyUploadFailure()` and the block editor's `getErrorMessage()` cannot drift.
 *
 * @param {string}  errorCode          - The `code` carried by the failure, if it carried one.
 * @param {boolean} hasConnectionError - Whether the connection store is reporting an error.
 * @return {boolean} Whether the failure should be attributed to the connection.
 */
export function isConnectionAttributedFailure(
	errorCode: string | undefined,
	hasConnectionError: boolean
): boolean {
	return errorCode === UPLOAD_TOKEN_ERROR_CODE && hasConnectionError;
}

type UploadingStatusProp = 'idle' | 'resumed' | 'aborted' | 'uploading' | 'done' | 'error';

type UploadingDataProps = {
	bytesSent: number;
	bytesTotal: number;
	percent: number;
	status: UploadingStatusProp;
};

type ResumaHandlerProps = {
	start: () => void;
	abort: () => void;
};

type UseResumableUploader = {
	onUploadHandler: ( event: ChangeEvent< HTMLInputElement > ) => void;
	uploadHandler: ( file: File ) => void;
	resumeHandler: ResumaHandlerProps;
	uploadingData: UploadingDataProps;
	media: VideoMediaProps;
	error: ResumableUploadError | null;
};

type UseResumableUploaderProps = {
	onProgress: ( bytesSent: number, bytesTotal: number ) => void;
	onSuccess: ( data: VideoMediaProps ) => void;
	onError: ( error: ResumableUploadError ) => void;
};

const useResumableUploader = ( {
	onProgress,
	onSuccess,
	onError,
}: UseResumableUploaderProps ): UseResumableUploader => {
	const [ uploadingData, setUploadingData ] = useState< UploadingDataProps >( {
		bytesSent: 0,
		bytesTotal: 0,
		percent: 0,
		status: 'idle',
	} );

	const [ media, setMedia ] = useState< VideoMediaProps >();
	const [ error, setError ] = useState< ResumableUploadError | null >( null );
	const [ resumeHandler, setResumeHandler ] = useState< ResumaHandlerProps >();

	/**
	 * Upload a file
	 *
	 * @param {File} file - the file to upload
	 * @return {*} ???
	 */
	async function uploadHandler( file: File ) {
		// The file starts to upload automatically, so we need to set the status to uploading
		if ( uploadingData.status === 'idle' ) {
			setUploadingData( prev => {
				return { ...prev, status: 'uploading' };
			} );
		}

		let isDone = false;
		const resumableHandler = resumableFileUploader( {
			file,
			onProgress: ( bytesSent: number, bytesTotal: number ) => {
				// If the upload is done, don't update the progress
				if ( isDone ) {
					return;
				}

				const percent = Math.round( ( bytesSent / bytesTotal ) * 100 );
				setUploadingData( {
					bytesSent,
					bytesTotal,
					percent,
					status: 'uploading',
				} );
				onProgress( bytesSent, bytesTotal );
			},
			onSuccess: ( data: VideoMediaProps ) => {
				isDone = true;
				setUploadingData( prev => ( { ...prev, status: 'done' } ) );
				setMedia( data );
				onSuccess( data );
			},
			onError: ( err: ResumableUploadError ) => {
				setUploadingData( prev => ( { ...prev, status: 'error' } ) );
				setError( err );
				onError( err );
			},
		} );

		const resumable = {
			start: () => {
				setUploadingData( prev => ( { ...prev, status: 'uploading' } ) );
				resumableHandler.start();
			},
			abort: () => {
				setUploadingData( prev => ( { ...prev, status: 'aborted' } ) );
				resumableHandler.abort();
			},
		};

		setResumeHandler( resumable );
	}

	/**
	 * Handler for the file upload
	 *
	 * @param {ChangeEvent< HTMLInputElement >} event - the event object
	 */
	function onUploadHandler( event: ChangeEvent< HTMLInputElement > ) {
		const file = event.target.files[ 0 ];
		if ( ! file ) {
			debug( 'No file selected. Bail early' );
			return;
		}

		uploadHandler( file );
	}

	return { onUploadHandler, uploadHandler, resumeHandler, uploadingData, media, error };
};

export default useResumableUploader;
