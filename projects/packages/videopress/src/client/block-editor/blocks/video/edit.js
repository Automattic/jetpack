/**
 * WordPress dependencies
 */

import { BlockIcon, useBlockProps } from '@wordpress/block-editor';
import { Spinner, Placeholder, Button, withNotices } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import { VideoPressIcon } from './components/icons';
import VideoPressInspectorControls from './components/inspector-controls';
import PosterImageBlockControl from './components/poster-image-block-control';
import VideoPressPlayer from './components/videopress-player';
import VideoPressUploader from './components/videopress-uploader';
import { getVideoPressUrl } from './utils/url';
import { description, title } from '.';

import './editor.scss';

const VIDEO_PREVIEW_ATTEMPTS_LIMIT = 10;

export const PlaceholderWrapper = withNotices( function ( {
	children,
	errorMessage,
	noticeUI,
	noticeOperations,
	instructions = description,
	disableInstructions,
} ) {
	useEffect( () => {
		if ( ! errorMessage ) {
			return;
		}

		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( errorMessage );
	}, [ errorMessage, noticeOperations ] );

	return (
		<Placeholder
			icon={ <BlockIcon icon={ VideoPressIcon } /> }
			label={ title }
			instructions={ disableInstructions ? null : instructions }
			notices={ noticeUI }
		>
			{ children }
		</Placeholder>
	);
} );

/**
 * VideoPress block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected     - Whether the block is selected.
 * @param {string} props.clientId        - Block client ID.
 * @returns {object}                     - React component.
 */
export default function VideoPressEdit( { attributes, setAttributes, isSelected, clientId } ) {
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
		guid,
		cacheHtml,
		poster,
		align,
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
		poster,
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
	const { html: previewHtml, scripts, width: previewWidth, height: previewHeight } = preview
		? preview
		: { html: null, scripts: [] };

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
		if ( ! previewHtml || previewHtml === cacheHtml ) {
			return;
		}

		setAttributes( { cacheHtml: previewHtml } );
	}, [ previewHtml, cacheHtml, setAttributes ] );

	const html = previewHtml || cacheHtml;

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

	/**
	 * Clean the generating process timer.
	 *
	 * @todo improve doc
	 */
	function cleanRegeneratingProcessTimer() {
		if ( ! rePreviewAttemptTimer?.current ) {
			return;
		}

		rePreviewAttemptTimer.current = clearInterval( rePreviewAttemptTimer.current );
	}

	useEffect( () => {
		// Attempts limit achieved. Bail early.
		if ( generatingPreviewCounter >= VIDEO_PREVIEW_ATTEMPTS_LIMIT ) {
			return cleanRegeneratingProcessTimer();
		}

		// VideoPress URL is not defined. Bail early and cleans the time.
		if ( ! videoPressUrl ) {
			return cleanRegeneratingProcessTimer();
		}

		// Bail early (clean the timer) if the preview is already being requested.
		if ( isRequestingEmbedPreview ) {
			return cleanRegeneratingProcessTimer();
		}

		// Bail early (clean the timer) when preview is defined.
		if ( preview ) {
			setGeneratingPreviewCounter( 0 ); // reset counter.
			return cleanRegeneratingProcessTimer();
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

		return cleanRegeneratingProcessTimer;
	}, [
		generatingPreviewCounter,
		rePreviewAttemptTimer,
		invalidateCachedEmbedPreview,
		preview,
		videoPressUrl,
		isRequestingEmbedPreview,
	] );

	const { className: blockMainClassName, ...blockProps } = useBlockProps( {
		className: 'wp-block-jetpack-videopress',
	} );

	// Handling all the upload/select file step
	// This is the first action for the user

	const [ isUploadingFile, setIsUploadingFile ] = useState( ! attributes?.guid );

	if ( isUploadingFile ) {
		const handleDoneUpload = () => {
			setIsUploadingFile( false );
		};

		return (
			<div { ...blockProps } className={ blockMainClassName }>
				<VideoPressUploader
					setAttributes={ setAttributes }
					attributes={ attributes }
					handleDoneUpload={ handleDoneUpload }
				/>
			</div>
		);
	}

	// Generating video preview.
	if (
		( isRequestingEmbedPreview || ! preview ) &&
		generatingPreviewCounter > 0 &&
		generatingPreviewCounter < VIDEO_PREVIEW_ATTEMPTS_LIMIT
	) {
		return (
			<div { ...blockProps } className={ blockMainClassName }>
				<PlaceholderWrapper disableInstructions>
					<div className="loading-wrapper">
						<Spinner />
						{ __( 'Generating preview…', 'jetpack-videopress-pkg' ) }
						<strong> { generatingPreviewCounter }</strong>
					</div>
				</PlaceholderWrapper>
			</div>
		);
	}

	// 5 - Generating video preview failed.
	if ( generatingPreviewCounter >= VIDEO_PREVIEW_ATTEMPTS_LIMIT && ! preview ) {
		return (
			<div { ...blockProps } className={ blockMainClassName }>
				<PlaceholderWrapper
					errorMessage={ __(
						'Impossible to get a video preview after ten attempts.',
						'jetpack-videopress-pkg'
					) }
					onNoticeRemove={ invalidateResolution }
				>
					<div className="videopress-uploader__error-actions">
						<Button variant="primary" onClick={ invalidateResolution }>
							{ __( 'Try again', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button
							variant="secondary"
							onClick={ () => {
								setAttributes( { src: undefined, id: undefined, guid: undefined } );
							} }
						>
							{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
						</Button>
					</div>
				</PlaceholderWrapper>
			</div>
		);
	}

	// X - Show VideoPress player. @todo: finish
	return (
		<div
			{ ...blockProps }
			className={ classNames( blockMainClassName, {
				[ `align${ align }` ]: align,
				'is-updating-preview': ! previewHtml,
			} ) }
		>
			<VideoPressInspectorControls attributes={ attributes } setAttributes={ setAttributes } />
			<PosterImageBlockControl
				attributes={ attributes }
				setAttributes={ setAttributes }
				clientId={ clientId }
			/>
			<VideoPressPlayer
				html={ html }
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
