/**
 * WordPress dependencies
 */

import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import { useBlockProps, BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from '../../../shared/icons';
import Loading from '../loading';
import { getVideoPressUrl } from '../url';
import VideoPressInspectorControls from './components/inspector-controls';
import VideoPressPlayer from './components/videopress-player';
import { useResumableUploader } from './hooks/use-uploader.js';
import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

export default function VideoPressEdit( { attributes, setAttributes, isSelected } ) {
	const {
		autoplay,
		loop,
		muted,
		controls,
		playsinline,
		preload,
		useAverageColor,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
		src,
		guid,
		cacheHtml,
	} = attributes;

	const initialVideoPressUrl = getVideoPressUrl( guid, {
		autoplay,
		controls,
		loop,
		muted,
		playsinline,
		preload,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
		useAverageColor,
	} );

	const [ videoPressUrl, setVideoPressUrl ] = useState( initialVideoPressUrl );

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

	// Get video preview status.
	const { preview, isRequestingEmbedPreview } = useSelect(
		select => {
			return {
				preview: select( coreStore ).getEmbedPreview( videoPressUrl ) || false,
				isRequestingEmbedPreview:
					select( coreStore ).isRequestingEmbedPreview( videoPressUrl ) || false,
			};
		},
		[ videoPressUrl ]
	);
	const { html: previewHtml, scripts } = preview ? preview : { html: null, scripts: [] };

	/*
	 * Store the preview html into a block attribute,
	 * to be used as a fallback while it pulls the new preview.
	 * Once the html changes, the attr will be updated, too.
	 */
	const html = previewHtml || cacheHtml;
	useEffect( () => {
		if ( ! previewHtml ) {
			return;
		}

		if ( previewHtml === cacheHtml ) {
			return;
		}

		// Update html cache when the preview changes.
		setAttributes( { cacheHtml: previewHtml } );
	}, [ previewHtml, cacheHtml, setAttributes ] );

	// Helper to invalidate the preview cache.
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;
	const invalidateCachedEmbedPreview = useCallback( () => {
		invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
	}, [ videoPressUrl, invalidateResolution ] );

	/*
	 * Getting VideoPress preview.
	 * The following code tries to handle issues
	 * when the preview is not available even when
	 * the VideoPress URL is gotten.
	 * It attempts every two seconds to get the so desired video preview.
	 */
	const [ isGeneratingPreview, setIsGeneratingPreview ] = useState( 0 );

	const rePreviewAttemptTimer = useRef();
	function cleanRegeneratingProcess() {
		if ( ! rePreviewAttemptTimer?.current ) {
			return;
		}

		rePreviewAttemptTimer.current = clearInterval( rePreviewAttemptTimer.current );
	}

	useEffect( () => {
		// VideoPress URL is not defined. Bail early and cleans the time.
		if ( ! videoPressUrl ) {
			return cleanRegeneratingProcess();
		}

		// Bail early (clean the timer) if the preview is already being requested.
		if ( isRequestingEmbedPreview ) {
			return cleanRegeneratingProcess();
		}

		// Bail early (clean the timer) when preview is defined.
		if ( preview ) {
			setIsGeneratingPreview( 0 );
			return cleanRegeneratingProcess();
		}

		// Bail early when it has been already started.
		if ( rePreviewAttemptTimer?.current ) {
			return;
		}

		rePreviewAttemptTimer.current = setTimeout( () => {
			// Abort whether the preview is already defined.
			if ( preview ) {
				setIsGeneratingPreview( 0 );
				return;
			}

			setIsGeneratingPreview( v => v + 1 );
			invalidateCachedEmbedPreview();
		}, 2000 );

		return cleanRegeneratingProcess;
	}, [
		rePreviewAttemptTimer,
		invalidateCachedEmbedPreview,
		preview,
		videoPressUrl,
		isRequestingEmbedPreview,
	] );

	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-videopress is-placeholder-container',
	} );

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
	 * todo: finish the implementation
	 *
	 * @param {string} videoUrl - URL of the video to attach
	 */
	function onSelectURL( videoUrl ) {
		const videoGuid = getGuidFromVideoUrl( videoUrl );
		if ( ! videoGuid ) {
			setUploadErrorDataState( { data: { message: __( 'Invalid VideoPress URL', 'jetpack' ) } } );
			return;
		}
		setAttributes( { guid: videoGuid, src: videoUrl } );
		setVideoPressUrl( videoUrl );
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

	/*
	 * 1 - Initial block state. Show MediaPlaceholder when:
	 *     - no src attribute,
	 *     - no in-progress uploading file to the backend
	 *     - no file recently uploaded to the backend
	 */

	if ( ! src && ! isUploadingFile && ! fileHasBeenUploaded ) {
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
					<div
						role="alert"
						aria-live="assertive"
						className="jetpack-videopress-upload-error-message"
					>
						{ uploadErrorData?.data?.message ??
							__( 'Failed to upload your video. Please try again.', 'jetpack' ) }
					</div>
				) }
			</MediaPlaceholder>
		);
	}

	// 2 - Uploading file to backend
	if ( isUploadingFile ) {
		return (
			<>
				<div { ...blockProps }>
					<Loading text={ __( '(2) Uploading file to backend…', 'jetpack' ) } />;
				</div>
			</>
		);
	}

	// 3 - Uploading file to VideoPress infrastructure
	if ( fileHasBeenUploaded && ! isRequestingEmbedPreview && ! videoPressUrl ) {
		return (
			<>
				<div { ...blockProps }>
					<Loading text={ __( '(3) Uploading file to VideoPress…', 'jetpack' ) } />;
				</div>
			</>
		);
	}

	// 4 - No html preview. Show generating message.
	if ( ! html ) {
		return (
			<>
				<div { ...blockProps }>
					<Loading text={ __( '(4) Generating preview…', 'jetpack' ) } />;
					<div>
						Attempt: <strong>{ isGeneratingPreview }</strong>
					</div>
				</div>
			</>
		);
	}

	// X - Show VideoPress player. @todo: finish
	return (
		<>
			<VideoPressInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
			<VideoPressPlayer
				html={ html }
				isUpdatingPreview={ ! previewHtml }
				scripts={ scripts }
				attributes={ attributes }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
				className="wp-block-jetpack-videopress"
			/>
		</>
	);
}
