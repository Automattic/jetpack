/**
 * External dependencies
 */
import { useState } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import getMediaToken from '../../lib/get-media-token';
import resumableFileUploader from '../../lib/resumable-file-uploader';
import { VideoMediaProps } from '../../lib/resumable-file-uploader/types';
import type React from 'react';

const debug = debugFactory( 'videopress:use-resumable-uploader' );

// eslint-disable-next-line no-shadow
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
	onUploadHandler: ( event: React.ChangeEvent< HTMLInputElement > ) => void;
	uploadHandler: ( file: File ) => void;
	resumeHandler: ResumaHandlerProps;
	uploadingData: UploadingDataProps;
	media: VideoMediaProps;
	error: string;
};

const useResumableUploader = ( { onProgress, onSuccess, onError } ): UseResumableUploader => {
	const [ uploadingData, setUploadingData ] = useState< UploadingDataProps >( {
		bytesSent: 0,
		bytesTotal: 0,
		percent: 0,
		status: 'idle',
	} );

	const [ media, setMedia ] = useState< VideoMediaProps >();
	const [ error, setError ] = useState( null );
	const [ resumeHandler, setResumeHandler ] = useState< ResumaHandlerProps >();

	/**
	 * Upload a file
	 *
	 * @param {File} file - the file to upload
	 * @returns {*} ???
	 */
	async function uploadHandler( file: File ) {
		const tokenData = await getMediaToken( 'upload-jwt' );
		if ( ! tokenData.token ) {
			return onError( 'No token provided' );
		}

		// The file starts to upload automatically, so we need to set the status to uploading
		if ( uploadingData.status === 'idle' ) {
			setUploadingData( prev => {
				return { ...prev, status: 'uploading' };
			} );
		}

		let isDone = false;
		const resumableHandler = resumableFileUploader( {
			file,
			tokenData,
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
			onError: ( err: Error ) => {
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
	 * @param {React.ChangeEvent< HTMLInputElement >} event - the event object
	 */
	function onUploadHandler( event: React.ChangeEvent< HTMLInputElement > ) {
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
