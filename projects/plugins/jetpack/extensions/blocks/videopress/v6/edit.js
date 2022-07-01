/**
 * WordPress dependencies
 */

import { useBlockProps } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import Loading from '../loading';
import { getVideoPressUrl } from '../url';
import VideoPressInspectorControls from './components/inspector-controls';
import VideoPressPlayer from './components/videopress-player';
import VideoPressUploader from './components/videopress-uploader';

import './editor.scss';

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
		return (
			<VideoPressUploader
				setAttributes={ setAttributes }
				attributes={ attributes }
				blockProps={ blockProps }
			/>
		);
	}

	// 2 - No html preview. Show generating message.
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
		<div { ...videoPlayerBlockProps }>
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
		</div>
	);
}
