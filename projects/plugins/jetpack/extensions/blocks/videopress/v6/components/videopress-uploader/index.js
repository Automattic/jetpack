import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { VideoPressIcon as icon } from '../../../../../shared/icons';
import Loading from '../../../loading';
import { useResumableUploader } from '../../hooks/use-uploader.js';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

const VideoPressUploader = ( { blockProps, attributes, setAttributes } ) => {
	/*
	 * Tracking state when uploading the video file.
	 * uploadingProgress is an array with two items:
	 *  - the first item is the upload progress
	 *  - the second item is total
	 */
	const [ uploadingProgress, setUploadingProgressState ] = useState( [] );
	// Define a memoized function to register the upload progress.
	const setUploadingProgress = useCallback( function ( ...args ) {
		setUploadingProgressState( args );
	}, [] );

	/*
	 * Tracking error data
	 */
	const [ uploadErrorData, setUploadErrorDataState ] = useState( null );

	// Define a memoized function to register the error data.
	const setUploadErrorData = useCallback( function ( error ) {
		if ( error?.originalResponse ) {
			try {
				// parse failed request response message
				const body = error?.originalResponse?.getBody?.();
				const parsedBody = JSON.parse( body );
				setUploadErrorDataState( parsedBody );
				return;
			} catch {}
		}

		setUploadErrorDataState( error );
	}, [] );

	/*
	 * It's considered the file is uploading
	 * when the progress value is lower than the total.
	 */
	const isUploadingFile = !! (
		uploadingProgress?.length && uploadingProgress[ 0 ] < uploadingProgress[ 1 ]
	);

	// File has been upload when the progress value is equal to the total.
	const fileHasBeenUploaded = !! (
		uploadingProgress?.length && uploadingProgress[ 0 ] === uploadingProgress[ 1 ]
	);

	// Helper instance to upload the video to the VideoPress infrastructure.
	const [ videoPressUploader ] = useResumableUploader( {
		onError: setUploadErrorData,
		onProgress: setUploadingProgress,
		onSuccess: setAttributes,
	} );

	// Returns true if the object represents a valid host for a VideoPress video.
	// Private vidoes are hosted under video.wordpress.com
	const isValidVideoPressUrl = urlObject => {
		const validHosts = [ 'videopress.com', 'video.wordpress.com' ];
		return urlObject.protocol === 'https:' && validHosts.includes( urlObject.host );
	};

	/**
	 * Helper function to pick up the guid
	 * from the VideoPress URL.
	 *
	 * @param {string} url - VideoPress URL.
	 * @returns {void}       The guid picked up from the URL. Otherwise, False.
	 */
	const getGuidFromVideoUrl = url => {
		try {
			const urlObject = new URL( url );
			if ( isValidVideoPressUrl( urlObject ) ) {
				const videoGuid = urlObject.pathname.match( /^\/v\/([a-zA-Z0-9]+)$/ );
				return videoGuid.length === 2 ? videoGuid[ 1 ] : false;
			}
		} catch ( e ) {
			return false;
		}
	};

	/**
	 * Handler to add a video via an URL.
	 *
	 * @param {string} videoUrl - URL of the video to attach
	 */
	function onSelectURL( videoUrl ) {
		const videoGuid = getGuidFromVideoUrl( videoUrl );
		if ( ! videoGuid ) {
			setUploadErrorDataState( { data: { message: __( 'Invalid VideoPress URL', 'jetpack' ) } } );
			return;
		}

		// Update guid based on the URL.
		setAttributes( { guid: videoGuid, src: videoUrl } );
	}

	/**
	 * Uploading file handler.
	 *
	 * @param {File} media - media file to upload
	 * @returns {void}
	 */
	function onSelectVideo( media ) {
		const fileUrl = media?.url;
		if ( ! isBlobURL( fileUrl ) ) {
			return;
		}

		const file = getBlobByURL( fileUrl );
		const isResumableUploading = null !== file && file instanceof File;
		if ( ! isResumableUploading ) {
			return;
		}

		// reset error
		if ( uploadErrorData ) {
			setUploadErrorData( null );
		}

		setUploadingProgress( [ 0, file.size ] );

		// Upload file to VideoPress infrastructure.
		videoPressUploader( file );
	}

	// Uploading file to backend
	if ( isUploadingFile ) {
		return (
			<>
				<div { ...blockProps }>
					<Loading text={ __( '(2) Uploading file to backend…', 'jetpack' ) } />;
				</div>
			</>
		);
	}

	// Uploading file to VideoPress infrastructure
	if ( fileHasBeenUploaded ) {
		return (
			<>
				<div { ...blockProps }>
					<Loading text={ __( '(3) Uploading file to VideoPress…', 'jetpack' ) } />;
				</div>
			</>
		);
	}

	// Default view to select file to upload

	return (
		<MediaPlaceholder
			icon={ <BlockIcon icon={ icon } /> }
			labels={ {
				title: __( 'VideoPress', 'jetpack' ),
			} }
			onSelect={ onSelectVideo }
			onSelectURL={ onSelectURL }
			accept="video/*"
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			value={ attributes }
			onError={ function ( error ) {
				// eslint-disable-next-line no-console
				console.error( 'Error: ', error );
			} }
		>
			{ uploadErrorData && (
				<div role="alert" aria-live="assertive" className="jetpack-videopress-upload-error-message">
					{ uploadErrorData?.data?.message ??
						__( 'Failed to upload your video. Please try again.', 'jetpack' ) }
				</div>
			) }
		</MediaPlaceholder>
	);
};

export default VideoPressUploader;
