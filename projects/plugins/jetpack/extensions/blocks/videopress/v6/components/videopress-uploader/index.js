/**
 * External dependencies
 */
import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import { useBlockProps, BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { Button, Icon } from '@wordpress/components';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __, sprintf } from '@wordpress/i18n';
import filesize from 'filesize';
/**
 * Internal dependencies
 */
import { useResumableUploader } from '../../hooks/use-uploader.js';
import { VideoPressIcon } from '../icons';
import './style.scss';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

const UploadWrapper = ( { children } ) => {
	const blockProps = useBlockProps( { className: 'videopress-uploader' } );
	return (
		<div { ...blockProps }>
			<div className="videopress-uploader__logo">
				<Icon icon={ VideoPressIcon } />
				<div>{ __( 'VideoPress', 'jetpack' ) }</div>
			</div>
			{ children }
		</div>
	);
};

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
		<UploadWrapper>
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
		</UploadWrapper>
	);
};

const UploadError = ( { message, onRetry, onCancel } ) => {
	const errorMessage = message ?? __( 'Failed to upload your video. Please try again.', 'jetpack' );

	return (
		<UploadWrapper>
			<div role="alert" aria-live="assertive" className="videopress-uploader__error-message">
				{ errorMessage }
			</div>
			<div className="videopress-uploader__error-actions">
				<Button variant="primary" onClick={ onRetry }>
					{ __( 'Try again', 'jetpack' ) }
				</Button>
				<Button variant="secondary" onClick={ onCancel }>
					{ __( 'Cancel', 'jetpack' ) }
				</Button>
			</div>
		</UploadWrapper>
	);
};

const VideoPressUploader = ( { attributes, setAttributes } ) => {
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
		const fileUrl = media?.url;
		if ( ! isBlobURL( fileUrl ) ) {
			return;
		}

		const file = getBlobByURL( fileUrl );
		const isResumableUploading = null !== file && file instanceof File;

		if ( ! isResumableUploading ) {
			return;
		}

		startUpload( file );
	}

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

		return (
			<UploadError
				onRetry={ onRetry }
				onCancel={ onCancel }
				message={ uploadErrorData?.data?.message }
			/>
		);
	}

	// Uploading file to backend
	if ( isUploadingFile || fileHasBeenUploaded ) {
		const progress = ( uploadingProgress[ 0 ] / uploadingProgress[ 1 ] ) * 100;
		return <UploadProgress file={ uploadFile } progress={ progress } />;
	}

	// Default view to select file to upload
	return (
		<MediaPlaceholder
			icon={ <BlockIcon icon={ VideoPressIcon } /> }
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
		/>
	);
};

export default VideoPressUploader;
