/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { Spinner, withNotices, Button, ExternalLink } from '@wordpress/components';
import { useCallback, useState, useEffect, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useResumableUploader from '../../../../../hooks/use-resumable-uploader';
import { uploadFromLibrary } from '../../../../../hooks/use-uploader';
import { buildVideoPressURL, pickVideoBlockAttributesFromUrl } from '../../../../../lib/url';
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from '../../constants';
import { PlaceholderWrapper } from '../../edit';
import { VideoPressIcon } from '../icons';
import UploadError from './uploader-error.js';
import UploadProgress from './uploader-progress.js';
import './style.scss';

const VideoPressUploader = ( {
	attributes,
	setAttributes,
	noticeUI,
	noticeOperations,
	handleDoneUpload,
	fileToUpload,
	isReplacing,
	onReplaceCancel,
} ) => {
	const [ uploadPaused, setUploadPaused ] = useState( false );
	const [ uploadedVideoData, setUploadedVideoData ] = useState( false );
	const [ isUploadingInProgress, setIsUploadingInProgress ] = useState( false );
	const [ isVerifyingLocalMedia, setIsVerifyingLocalMedia ] = useState( false );

	/*
	 * When the file to upload is set, start the upload process
	 * just after the component is mounted.
	 */
	useEffect( () => {
		if ( ! fileToUpload ) {
			return;
		}

		startUpload( fileToUpload );
	}, [ fileToUpload ] );

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

	// Get file upload handlers, data, and error.
	const {
		uploadHandler,
		resumeHandler,
		error: uploadingError,
	} = useResumableUploader( {
		onError: setUploadErrorData,
		onProgress: setUploadingProgress,
		onSuccess: setUploadedVideoData,
	} );

	/**
	 * Handler to add a video via an URL.
	 *
	 * @param {string} videoSource - URL of the video to attach
	 * @param {string} id - Attachment ID if available
	 */
	function onSelectURL( videoSource, id ) {
		// If the video source is a VideoPress URL, we can use it directly.
		const { guid: guidFromSource, url: srcFromSource } = buildVideoPressURL( videoSource );
		if ( ! guidFromSource ) {
			setUploadErrorDataState( {
				data: { message: __( 'Invalid VideoPress URL', 'jetpack-videopress-pkg' ) },
			} );
			return;
		}

		const attrs = pickVideoBlockAttributesFromUrl( srcFromSource );
		handleDoneUpload( { ...attrs, guid: guidFromSource, id } );
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
		uploadHandler( file );
	};

	const startUploadFromLibrary = attachmentId => {
		uploadFromLibrary( attachmentId )
			.then( result => {
				setUploadedVideoData( result );
			} )
			.catch( error => {
				setUploadErrorDataState( error );
			} );
	};

	const pauseOrResumeUpload = () => {
		if ( ! resumeHandler ) {
			return;
		}

		const resumablerCall = uploadPaused ? 'start' : 'abort';
		resumeHandler[ resumablerCall ]();
		setUploadPaused( ! uploadPaused );
	};

	const cancelUploadingReplaceFile = function () {
		resumeHandler.abort();
		onReplaceCancel();
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

		/*
		 * For some reason, the `instance of File` check doesn't work.
		 * It returns false even when the media is a File.
		 * https://github.com/Automattic/jetpack/issues/28191
		 */
		// const isUploadingFile = media instanceof File;
		const isUploadingFile = media?.name && media?.size && media?.type;

		// - Handle upload by selecting a File
		if ( isUploadingFile ) {
			startUpload( media );
			return;
		}

		// - Handle selection of Media Library VideoPress attachment
		if ( media.videopress_guid ) {
			const videoGuid = Array.isArray( media.videopress_guid )
				? media.videopress_guid[ 0 ] // <- pick the first item when it's an array
				: media.videopress_guid;

			onSelectURL( videoGuid, media?.id );
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
						onSelectURL( result.uploaded_video_guid );
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

	if ( uploadingError?.code === 'owner_not_connected' ) {
		const connectUserDescription = createInterpolateElement(
			__(
				'<connectLink>Connect</connectLink> your site to use the <moreAboutVideoPressLink>VideoPress</moreAboutVideoPressLink> video block.',
				'jetpack-videopress-pkg'
			),
			{
				connectLink: <a href={ uploadingError?.data?.connect_url } rel="noreferrer noopener" />,
				moreAboutVideoPressLink: <ExternalLink href={ getRedirectUrl( 'jetpack-videopress' ) } />,
			}
		);

		return (
			<PlaceholderWrapper errorMessage={ connectUserDescription }>
				<Button
					key="videopress-connect-user"
					variant="primary"
					href={ uploadingError?.data?.connect_url }
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
				uploadedVideoData={ uploadedVideoData }
				onPauseOrResume={ pauseOrResumeUpload }
				onReplaceCancel={ cancelUploadingReplaceFile }
				isReplacing={ isReplacing }
				onDone={ handleDoneUpload }
				supportPauseOrResume={ !! resumeHandler }
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
				// These strings should match the "title" and "description" in ../../block.json.
				title: __( 'VideoPress', 'jetpack-videopress-pkg' ),
				instructions: __(
					'Embed a video from your media library or upload a new one with VideoPress.',
					'jetpack-videopress-pkg'
				),
			} }
			onSelect={ onSelectVideo }
			onSelectURL={ onSelectURL }
			accept="video/*"
			allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
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
