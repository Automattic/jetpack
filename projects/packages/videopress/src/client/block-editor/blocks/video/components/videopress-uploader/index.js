/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { Spinner, withNotices, Button, ExternalLink } from '@wordpress/components';
import { useCallback, useState, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useRef } from 'react';
/**
 * Internal dependencies
 */
import { useResumableUploader } from '../../../../../hooks/use-uploader';
import { PlaceholderWrapper } from '../../edit.js';
import { description, title } from '../../index.js';
import { VideoPressIcon } from '../icons';
import UploadError from './uploader-error.js';
import UploadProgress from './uploader-progress.js';
import './style.scss';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

const VideoPressUploader = ( {
	attributes,
	setAttributes,
	noticeUI,
	noticeOperations,
	handleDoneUpload,
} ) => {
	const [ uploadPaused, setUploadPaused ] = useState( false );
	const [ uploadCompleted, setUploadCompleted ] = useState( false );
	const [ isUploadingInProgress, setIsUploadingInProgress ] = useState( false );
	const [ isVerifyingLocalMedia, setIsVerifyingLocalMedia ] = useState( false );
	const tusUploader = useRef( null );

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
	 * Handle upload success
	 */
	const handleUploadSuccess = attr => {
		setAttributes( attr );
		setUploadCompleted( true );
	};

	// Helper instance to upload the video to the VideoPress infrastructure.
	// eslint-disable-next-line no-unused-vars
	const [ videoPressUploader, jwtData, jwtError ] = useResumableUploader( {
		onError: setUploadErrorData,
		onProgress: setUploadingProgress,
		onSuccess: handleUploadSuccess,
	} );

	/*
	 * Returns true if the object represents a valid host for a VideoPress video.
	 * Private vidoes are hosted under video.wordpress.com
	 */
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
			setUploadErrorDataState( {
				data: { message: __( 'Invalid VideoPress URL', 'jetpack-videopress-pkg' ) },
			} );
			return;
		}

		// Update guid based on the URL.
		setAttributes( { guid: videoGuid, src: videoUrl } );
		handleDoneUpload();
	}

	const startUpload = file => {
		// reset error
		if ( uploadErrorData ) {
			setUploadErrorData( null );
		}

		setFile( file );
		setUploadingProgress( 0, file.size );
		setIsUploadingInProgress( true );

		// Upload file to VideoPress infrastructure.
		tusUploader.current = videoPressUploader( file );
	};

	const startUploadFromLibrary = attachmentId => {
		const path = `videopress/v1/upload/${ attachmentId }`;
		apiFetch( { path, method: 'POST' } )
			.then( result => {
				if ( 'uploading' === result.status ) {
					startUploadFromLibrary( attachmentId );
				} else if ( 'complete' === result.status ) {
					handleUploadSuccess( {
						guid: result.uploaded_details.guid,
						id: result.uploaded_details.media_id,
						src: result.uploaded_details.src,
					} );
				} else if ( 'error' === result.status ) {
					setUploadErrorDataState( {
						data: { message: result.error },
					} );
				} else {
					setUploadErrorDataState( {
						// Should never happen.
						data: { message: __( 'Unexpected error uploading video.', 'jetpack-videopress-pkg' ) },
					} );
				}
			} )
			.catch( error => {
				setUploadErrorDataState( {
					data: { message: error.message },
				} );
			} );
	};

	const pauseOrResumeUpload = () => {
		const uploader = tusUploader?.current;

		if ( uploader ) {
			const uploaderCall = uploadPaused ? 'start' : 'abort';
			uploader[ uploaderCall ]();
			setUploadPaused( ! uploadPaused );
		}
	};

	/**
	 * Uploading file handler.
	 *
	 * @param {File} media - media file to upload
	 * @returns {void}
	 */
	function onSelectVideo( media ) {
		/*
		 * Allow uploading only (the first) one file
		 * @todo: Allow uploading multiple files
		 */
		media = media?.[ 0 ] ? media[ 0 ] : media;

		const isFileUploading = media instanceof File;
		// Handle upload by selecting a File
		if ( isFileUploading ) {
			startUpload( media );
			return;
		}

		// Handle selection of Media Library VideoPress attachment
		if ( media.videopress_guid ) {
			const videoGuid = media.videopress_guid[ 0 ];
			const videoUrl = `https://videopress.com/v/${ videoGuid }`;
			onSelectURL( videoUrl );
			return;
		}

		// Handle selection of Media Library regular attachment
		if ( media.id ) {
			const path = `videopress/v1/upload/${ media.id }`;

			setIsVerifyingLocalMedia( true );

			apiFetch( { path, method: 'GET' } )
				.then( result => {
					setIsVerifyingLocalMedia( false );

					if ( 'new' === result.status || 'resume' === result.status ) {
						setFile( media );
						// We set it to 100% since the first step (uploading from computer) is already made.
						setUploadingProgress( result.file_size, result.file_size );
						setIsUploadingInProgress( true );
						startUploadFromLibrary( media.id );
					} else if ( 'uploaded' === result.status ) {
						const videoUrl = `https://videopress.com/v/${ result.uploaded_video_guid }`;
						onSelectURL( videoUrl );
					} else {
						setUploadErrorDataState( {
							data: {
								message: result.message
									? result.message
									: __( 'Error selecting video. Please try again.', 'jetpack-videopress-pkg' ),
							},
						} );
					}
				} )
				.catch( error => {
					setIsVerifyingLocalMedia( false );
					setUploadErrorDataState( {
						data: { message: error.message },
					} );
				} );

			return;
		}

		setUploadErrorDataState( {
			data: {
				message: __(
					'Please select a video from Library or upload a new one',
					'jetpack-videopress-pkg'
				),
			},
		} );
	}

	if ( jwtError?.code === 'owner_not_connected' ) {
		const connectUserDescription = createInterpolateElement(
			__(
				'<connectLink>Connect</connectLink> your site to use the <moreAboutVideoPressLink>VideoPress</moreAboutVideoPressLink> video block.',
				'jetpack-videopress-pkg'
			),
			{
				connectLink: <a href={ jwtError?.data?.connect_url } rel="noreferrer noopener" />,
				moreAboutVideoPressLink: <ExternalLink href={ getRedirectUrl( 'jetpack-videopress' ) } />,
			}
		);

		return (
			<PlaceholderWrapper errorMessage={ connectUserDescription }>
				<Button
					key="videopress-connect-user"
					variant="primary"
					href={ jwtError?.data?.connect_url }
				>
					{ __( 'Connect', 'jetpack-videopress-pkg' ) }
				</Button>
			</PlaceholderWrapper>
		);
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
			setIsUploadingInProgress( false );
		};

		return <UploadError onRetry={ onRetry } onCancel={ onCancel } errorData={ uploadErrorData } />;
	}

	// Uploading file to backend
	if ( isUploadingInProgress ) {
		const progress = ( uploadingProgress[ 0 ] / uploadingProgress[ 1 ] ) * 100;
		return (
			<UploadProgress
				attributes={ attributes }
				setAttributes={ setAttributes }
				file={ uploadFile }
				progress={ progress }
				paused={ uploadPaused }
				completed={ uploadCompleted }
				onPauseOrResume={ pauseOrResumeUpload }
				onDone={ handleDoneUpload }
				supportPauseOrResume={ Boolean( tusUploader?.current ) }
			/>
		);
	}

	if ( isVerifyingLocalMedia ) {
		return (
			<PlaceholderWrapper disableInstructions>
				<div className="loading-wrapper">
					<Spinner />
					<span>{ __( 'Loading…', 'jetpack-videopress-pkg' ) }</span>
				</div>
			</PlaceholderWrapper>
		);
	}

	// Default view to select file to upload
	return (
		<MediaPlaceholder
			handleUpload={ false }
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
