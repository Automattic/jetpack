/**
 * External dependencies
 */
import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { Button, withNotices, ExternalLink } from '@wordpress/components';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __, sprintf } from '@wordpress/i18n';
import filesize from 'filesize';
import { PlaceholderWrapper } from '../../edit.js';
/**
 * Internal dependencies
 */
import { useResumableUploader } from '../../hooks/use-uploader.js';
import { description, title } from '../../index.js';
import { VideoPressIcon } from '../icons';
import './style.scss';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

const UploadProgress = ( { progress, file } ) => {
	const roundedProgress = Math.round( progress );
	const cssWidth = { width: `${ roundedProgress }%` };

	const fileSizeLabel = filesize( file?.size );
	const escapedFileName = escapeHTML( file?.name );
	const fileNameLabel = createInterpolateElement(
		sprintf(
			/* translators: Placeholder is a video file name. */
			__( 'Uploading <strong>%s</strong>', 'jetpack' ),
			escapedFileName
		),
		{ strong: <strong /> }
	);

	return (
		<PlaceholderWrapper>
			<div className="videopress-uploader-progress">
				<div className="videopress-uploader-progress__file-info">
					<div className="videopress-uploader-progress__file-name">{ fileNameLabel }</div>
					&nbsp;&#8212;&nbsp;
					<div className="videopress-uploader-progress__file-size">{ fileSizeLabel }</div>
				</div>
				<div className="videopress-uploader-progress__progress">
					<div className="videopress-uploader-progress__progress-loaded" style={ cssWidth } />
				</div>
				<div className="videopress-uploader-progress__actions">
					<div className="videopress-upload__percent-complete">{ `${ roundedProgress }%` }</div>
				</div>
			</div>
		</PlaceholderWrapper>
	);
};

const UploadError = ( { message, onRetry, onCancel } ) => {
	return (
		<PlaceholderWrapper errorMessage={ message } onNoticeRemove={ onCancel }>
			<div className="videopress-uploader__error-actions">
				<Button variant="primary" onClick={ onRetry }>
					{ __( 'Try again', 'jetpack' ) }
				</Button>
				<Button variant="secondary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack' ) }
				</Button>
			</div>
		</PlaceholderWrapper>
	);
};

const VideoPressUploader = ( { attributes, setAttributes, noticeUI, noticeOperations } ) => {
	/*
	 * Storing the file to get it name and size for progress.
	 */
	const [ uploadFile, setFile ] = useState( null );

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

	const startUpload = file => {
		// reset error
		if ( uploadErrorData ) {
			setUploadErrorData( null );
		}

		setFile( file );
		setUploadingProgress( 0, file.size );

		// Upload file to VideoPress infrastructure.
		videoPressUploader( file );
	};

	/**
	 * Uploading file handler.
	 *
	 * @param {File} media - media file to upload
	 * @returns {void}
	 */
	function onSelectVideo( media ) {
		if ( media.videopress_guid ) {
			const videoUrl = `https://videopress.com/v/${ media.videopress_guid[ 0 ] }`;
			if ( getGuidFromVideoUrl( videoUrl ) ) {
				return onSelectURL( videoUrl );
			}
		}
		const fileUrl = media?.url;
		if ( ! isBlobURL( fileUrl ) ) {
			setUploadErrorDataState( {
				data: { message: __( 'Please select a VideoPress video', 'jetpack' ) },
			} );
			return;
		}

		const file = getBlobByURL( fileUrl );
		const isResumableUploading = null !== file && file instanceof File;

		if ( ! isResumableUploading ) {
			return;
		}

		startUpload( file );
	}

	const getErrorMessage = () => {
		if ( ! uploadErrorData ) {
			return '';
		}

		let errorMessage =
			uploadErrorData?.data?.message ||
			__( 'Failed to upload your video. Please try again.', 'jetpack' );

		// Let's give this error a better message.
		if ( errorMessage === 'Invalid Mime' ) {
			errorMessage = (
				<>
					{ __( 'The format of the video you uploaded is not supported.', 'jetpack' ) }
					&nbsp;
					<ExternalLink
						href="https://wordpress.com/support/videopress/recommended-video-settings/"
						target="_blank"
						rel="noreferrer"
					>
						{ __( 'Check the recommended video settings.', 'jetpack' ) }
					</ExternalLink>
				</>
			);
		}

		return errorMessage;
	};

	// Showing error if upload fails
	if ( uploadErrorData ) {
		const onRetry = () => {
			startUpload( uploadFile );
		};

		const onCancel = () => {
			setFile( null );
			setUploadingProgress( [] );
			setUploadErrorData( null );
		};

		return <UploadError onRetry={ onRetry } onCancel={ onCancel } message={ getErrorMessage() } />;
	}

	// Uploading file to backend
	if ( isUploadingFile || fileHasBeenUploaded ) {
		const progress = ( uploadingProgress[ 0 ] / uploadingProgress[ 1 ] ) * 100;
		return <UploadProgress file={ uploadFile } progress={ progress } />;
	}

	// Default view to select file to upload
	return (
		<MediaPlaceholder
			className="is-videopress-placeholder"
			icon={ <BlockIcon icon={ VideoPressIcon } /> }
			labels={ {
				title,
				instructions: description,
			} }
			onSelect={ onSelectVideo }
			onSelectURL={ onSelectURL }
			accept="video/*"
			allowedTypes={ ALLOWED_MEDIA_TYPES }
			value={ attributes }
			notices={ noticeUI }
			onError={ function ( error ) {
				noticeOperations.removeAllNotices();
				noticeOperations.createErrorNotice( error );
			} }
		/>
	);
};

export default withNotices( VideoPressUploader );
