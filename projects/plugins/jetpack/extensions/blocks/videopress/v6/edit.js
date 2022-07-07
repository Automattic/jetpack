/**
 * WordPress dependencies
 */

import { useBlockProps } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../url';
import VideoPressInspectorControls from './components/inspector-controls';
import VideoPressPlayer from './components/videopress-player';
import VideoPressUploader from './components/videopress-uploader';

import './editor.scss';

const VIDEO_PREVIEW_ATTEMPTS_LIMIT = 10;

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
		align,
		cacheThumbnail,
		videoRatio,
	} = attributes;

	const videoPressUrl = getVideoPressUrl( guid, {
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

	// Pick video properties from preview.
	const {
		html: previewHtml,
		scripts,
		thumbnail_url: previewThumbnail,
		width: previewWidth,
		height: previewHeight,
	} = preview ? preview : { html: null, scripts: [] };

	/*
	 * Store the preview markup and video thumbnail image
	 * into a block `html` and `thumbnail` attributes respectively.
	 *
	 * `html` will be used to render the player asap,
	 * while a fresh preview is geing fetched from the server,
	 * via the core store selectors.
	 *
	 * `thumbnail` will be shown as a fallback image
	 * until the fetching preview process finishes.
	 */
	useEffect( () => {
		if ( previewHtml && previewHtml !== cacheHtml ) {
			// Update html cache when the preview changes.
			setAttributes( { cacheHtml: previewHtml } );
		}

		if ( previewThumbnail && previewThumbnail !== cacheThumbnail ) {
			// Update thumbnail cache when the preview changes.
			setAttributes( { cacheThumbnail: previewThumbnail } );
		}
	}, [ previewHtml, cacheHtml, setAttributes, previewThumbnail, cacheThumbnail ] );

	const html = previewHtml || cacheHtml;
	const videoThumbnail = previewThumbnail || cacheThumbnail;

	// Store the video ratio to define the initial height of the video.
	useEffect( () => {
		if ( ! previewWidth || ! previewHeight ) {
			return;
		}

		const ratio = ( previewHeight / previewWidth ) * 100;
		if ( ratio === videoRatio ) {
			return;
		}

		setAttributes( { videoRatio: ratio } );
	}, [ videoRatio, previewWidth, previewHeight, setAttributes ] );

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
	const [ generatingPreviewCounter, setGeneratingPreviewCounter ] = useState( 0 );

	const rePreviewAttemptTimer = useRef();
	function cleanRegeneratingProcess() {
		if ( ! rePreviewAttemptTimer?.current ) {
			return;
		}

		rePreviewAttemptTimer.current = clearInterval( rePreviewAttemptTimer.current );
	}

	useEffect( () => {
		// Attempts limit achieved. Bail early.
		if ( generatingPreviewCounter >= VIDEO_PREVIEW_ATTEMPTS_LIMIT ) {
			return cleanRegeneratingProcess();
		}

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
			setGeneratingPreviewCounter( 0 ); // reset counter.
			return cleanRegeneratingProcess();
		}

		// Bail early when it has been already started.
		if ( rePreviewAttemptTimer?.current ) {
			return;
		}

		rePreviewAttemptTimer.current = setTimeout( () => {
			// Abort whether the preview is already defined.
			if ( preview ) {
				setGeneratingPreviewCounter( 0 ); // reset counter.
				return;
			}

			setGeneratingPreviewCounter( v => v + 1 );
			invalidateCachedEmbedPreview();
		}, 2000 );

		return cleanRegeneratingProcess;
	}, [
		generatingPreviewCounter,
		rePreviewAttemptTimer,
		invalidateCachedEmbedPreview,
		preview,
		videoPressUrl,
		isRequestingEmbedPreview,
	] );

	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-videopress is-placeholder-container',
	} );

	const videoPlayerBlockProps = useBlockProps( {
		className: classNames( 'wp-block-jetpack-videopress', {
			[ `align${ align }` ]: align,
			'is-updating-preview': ! previewHtml,
		} ),
	} );

	/*
	 * 1 - Initial block state. Show VideoPressUploader when:
	 *     - no src attribute,
	 *     - no in-progress uploading file to the backend
	 *     - no file recently uploaded to the backend
	 */
	if ( ! src || ( ! isRequestingEmbedPreview && ! videoPressUrl ) ) {
		return <VideoPressUploader setAttributes={ setAttributes } attributes={ attributes } />;
	}

	// 4 - Generating video preview
	if (
		( isRequestingEmbedPreview || ! preview ) &&
		generatingPreviewCounter > 0 &&
		generatingPreviewCounter < VIDEO_PREVIEW_ATTEMPTS_LIMIT
	) {
		return (
			<>
				<div { ...blockProps }>
					<Spinner />
					<div>{ __( '(4) Generating preview…', 'jetpack' ) }</div>
					<div>
						Attempt: <strong>{ generatingPreviewCounter }</strong>
					</div>
				</div>
			</>
		);
	}

	// 5 - Generating video preview
	if ( generatingPreviewCounter >= VIDEO_PREVIEW_ATTEMPTS_LIMIT && ! preview ) {
		return (
			<div { ...blockProps }>
				<div>
					{ __(
						'(5) Impossible to get a video preview after ten attempts. Show error.',
						'jetpack'
					) }
				</div>
			</div>
		);
	}

	// X - Show VideoPress player. @todo: finish
	return (
		<div { ...videoPlayerBlockProps }>
			<VideoPressInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
			<VideoPressPlayer
				html={ html }
				thumbnail={ videoThumbnail }
				isUpdatingPreview={ ! previewHtml }
				scripts={ scripts }
				attributes={ attributes }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
				className="wp-block-jetpack-videopress"
				preview={ preview }
			/>
		</div>
	);
}
