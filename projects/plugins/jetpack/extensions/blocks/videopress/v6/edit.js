/**
 * WordPress dependencies
 */

import { getBlobByURL, isBlobURL } from '@wordpress/blob';
import {
	InspectorControls,
	useBlockProps,
	BlockIcon,
	MediaPlaceholder,
} from '@wordpress/block-editor';
import { Button, PanelBody, ToggleControl, Tooltip } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from '../../../shared/icons';
import { VpBlock } from '../edit';
import Loading from '../loading';
// import { getJWT, useResumableUploader } from '../resumable-upload/use-uploader';
import { getVideoPressUrl } from '../url';
import { useResumableUploader } from './hooks/use-uploader.js';
import './editor.scss';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

// @Todo: replace with uploading implementation.
const noop = () => {};

export default function VideoPressEdit( { attributes, setAttributes } ) {
	const { controls, src, guid } = attributes;
	const prevMediaSrc = usePrevious( src );

	const videoPressUrl = getVideoPressUrl( guid, {
		controls,
	} );

	// Uploading file to backend states.
	const [ uploadingProgress, setUploadingProgress ] = useState( [] );
	const isUploadingFile = !! (
		uploadingProgress?.length && uploadingProgress[ 0 ] !== uploadingProgress[ 1 ]
	);
	const fileHasBeenUploaded = !! (
		uploadingProgress?.length && uploadingProgress[ 0 ] === uploadingProgress[ 1 ]
	);

	// Get video preview status
	const { preview, isRequestingEmbedPreview } = useSelect(
		select => {
			return {
				preview: select( coreStore ).getEmbedPreview( videoPressUrl ),
				isRequestingEmbedPreview: select( coreStore ).isRequestingEmbedPreview( videoPressUrl ),
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

	/*
	 * Due to a current bug in Gutenberg (https://github.com/WordPress/gutenberg/issues/16831),
	 * the `SandBox` component is not rendered again when the injected `html` prop changes.
	 * To work around that, we invalidate the cached preview of the embed VideoPress player
	 * in order to force the rendering of a new instance of the `SandBox` component
	 * that ensures the injected `html` will be rendered.
	 */
	useEffect( () => {
		if ( ! src || src === prevMediaSrc ) {
			return;
		}

		invalidateCachedEmbedPreview();
	}, [ src, prevMediaSrc, invalidateCachedEmbedPreview ] );

	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-videopress is-placeholder-container',
	} );

	const renderControlLabelWithTooltip = ( label, tooltipText ) => {
		return (
			<Tooltip text={ tooltipText } position="top">
				<span>{ label }</span>
			</Tooltip>
		);
	};

	const handleAttributeChange = attributeName => {
		return newValue => {
			setAttributes( { [ attributeName ]: newValue } );
		};
	};

	// Helper instance to upload the video to the VideoPress infrastructure.
	const [ videoPressUploader ] = useResumableUploader( {
		onProgress: ( progress, total ) => setUploadingProgress( [ progress, total ] ),
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

	const blockSettings = (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Video Settings', 'jetpack' ) }>
					<ToggleControl
						label={ renderControlLabelWithTooltip(
							__( 'Playback Controls', 'jetpack' ),
							/* translators: Tooltip describing the "controls" option for the VideoPress player */
							__( 'Display the video playback controls', 'jetpack' )
						) }
						onChange={ handleAttributeChange( 'controls' ) }
						checked={ controls }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);

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
				{ blockSettings }
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
				{ blockSettings }
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
				{ blockSettings }
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
				{ blockSettings }
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
				{ blockSettings }
				<div { ...blockProps }>
					<Loading text={ __( '(6) Generating preview…', 'jetpack' ) } />
				</div>
			</>
		);
	}

	// X - Show VideoPress player. @todo: finish
	return (
		<>
			{ blockSettings }
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
