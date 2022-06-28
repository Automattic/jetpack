/**
 * WordPress dependencies
 */

import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import { useBlockProps, BlockIcon, MediaPlaceholder } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from '../../../shared/icons';
import { VpBlock } from '../edit';
import Loading from '../loading';
import { getVideoPressUrl } from '../url';
import VideoPressInspectorControls from './components/inspector-controls';
import { useResumableUploader } from './hooks/use-uploader.js';
import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

// @Todo: replace with uploading implementation.
const noop = () => {};

export default function VideoPressEdit( { attributes, setAttributes } ) {
	const { controls, src, guid } = attributes;

	const videoPressUrl = getVideoPressUrl( guid, {
		controls,
	} );

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
	const { html, scripts } = preview ? preview : { html: null, scripts: null };

	// Helper to invalidate the preview cache.
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;
	const invalidateCachedEmbedPreview = useCallback( () => {
		invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
	}, [ videoPressUrl, invalidateResolution ] );

	const rePreviewAttemptTimer = useRef();
	function cleanTimer() {
		if ( ! rePreviewAttemptTimer?.current ) {
			return;
		}

		rePreviewAttemptTimer.current = clearInterval( rePreviewAttemptTimer.current );
	}

	/*
	 * Getting VideoPress preview
	 * The following block tries to handle issues
	 * when the preview is not available.
	 * There are some race conditions even
	 * the VideoPress URL is properly defined.
	 */
	useEffect( () => {
		// VideoPress URL is not defined. Bail early and cleans the time.
		if ( ! videoPressUrl ) {
			return cleanTimer();
		}

		// Bail early (clean the timer) if the preview is already being requested.
		if ( isRequestingEmbedPreview ) {
			return cleanTimer();
		}

		// Bail early (clean the timer) when preview is defined.
		if ( preview ) {
			return cleanTimer();
		}

		// Bail early (clean the timer) when it has been already started.
		if ( rePreviewAttemptTimer?.current ) {
			return;
		}

		rePreviewAttemptTimer.current = setTimeout( () => {
			// Abort whether the preview is already defined.
			if ( preview ) {
				return;
			}

			invalidateCachedEmbedPreview();
		}, 2000 );

		return cleanTimer;
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
		onError: function ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Error: ', error );
		},
		onProgress: setUploadingProgress,
		onSuccess: setAttributes,
	} );

	/**
	 * Handler to add a video via an URL.
	 * todo: finish the implementation
	 *
	 * @param {string} videoUrl - URL of the video to attach
	 */
	function onSelectURL( videoUrl ) {
		setAttributes( { src: videoUrl } );
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
				onError={ noop }
			/>
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

	// 4 - Generating video preview
	if ( isRequestingEmbedPreview && ! preview ) {
		return (
			<>
				<div { ...blockProps }>
					<Loading text={ __( '(4) Generating preview…', 'jetpack' ) } />
				</div>
			</>
		);
	}

	// 5 - Generating video preview: exposing cache issue: @todo remove this once the bug is fixed.
	if ( fileHasBeenUploaded && ! isRequestingEmbedPreview && ! preview ) {
		return (
			<>
				<div { ...blockProps }>
					<p>
						{ __( "The video is still being processed. It'll take a little bit more…", 'jetpack' ) }
					</p>
					<Button variant="secondary" onClick={ invalidateCachedEmbedPreview }>
						Clear Cache
					</Button>
				</div>
			</>
		);
	}

	// 6 - Generating video preview. Happens when component mounts.
	if ( ! preview ) {
		return (
			<>
				<div { ...blockProps }>
					<Loading text={ __( '(6) Generating preview…', 'jetpack' ) } />
				</div>
			</>
		);
	}

	// X - Show VideoPress player. @todo: finish
	return (
		<>
			<VideoPressInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
			<VpBlock
				html={ html }
				scripts={ scripts }
				interactive={ true }
				hideOverlay={ false }
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</>
	);
}
