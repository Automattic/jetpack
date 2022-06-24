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
import { SandBox, PanelBody, ToggleControl, Tooltip } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from '../../../shared/icons';
import { VideoPressBlockProvider } from '../components';
import Loading from '../loading';
import ResumableUpload from '../resumable-upload';
import { getVideoPressUrl } from '../url';

const ALLOWED_MEDIA_TYPES = [ 'video' ];

// @Todo: replace with uploading implementation.
const noop = () => {};

export default function VideoPressEdit( { attributes, setAttributes } ) {
	const { controls, src, guid } = attributes;

	/*
	 * Store here the file uploaded by the user to the client
	 * This file is going to be uploaded to the VideoPress infrastructure
	 */
	const [ fileForUpload, setFileForUpload ] = useState( null );

	const videoPressUrl = getVideoPressUrl( guid, {
		controls: true, // @todo: behave all video options here.
	} );

	// Check whether it's working on the video preview
	const { preview, isRequestingEmbedPreview } = useSelect(
		select => ( {
			preview: select( coreStore ).getEmbedPreview( videoPressUrl ),
			isRequestingEmbedPreview: select( coreStore ).isRequestingEmbedPreview( videoPressUrl ),
		} ),
		[ videoPressUrl ]
	);

	const { html, scripts } = preview ? preview : { html: null, scripts: null };

	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-videopress',
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
	 * Uploading file handler
	 *
	 * @param {File} media - meida file to upload
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

		setFileForUpload( file );
	}

	/**
	 * Handler to set block attributes
	 * once the uploading to VideoPress infrastructure finishes
	 *
	 * @param {object} data         - ResumableUpload onSuccess callback data
	 * @param {string} data.mediaId - Media ID of the uploaded media file
	 * @param {string} data.guid    - Media GUID of the uploaded media file
	 * @param {string} data.src     - Media SRC of the uploaded media file
	 */
	function videoPressUploadingFinished( { mediaId, guid: videoGuid, src: videoSrc } ) {
		setFileForUpload( null ); // clean the state
		if ( mediaId && videoGuid && videoSrc ) {
			setAttributes( { id: mediaId, guid: videoGuid, src: videoSrc } );
		}
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

	if ( fileForUpload ) {
		return (
			<>
				{ blockSettings }
				<VideoPressBlockProvider onUploadFinished={ videoPressUploadingFinished }>
					<ResumableUpload file={ fileForUpload } />
				</VideoPressBlockProvider>
			</>
		);
	}

	/*
	 * 1 - Initial block state
	 *     Show MediaPlaceholder when no src attrbitute,
	 *     but also when there is not a file to upload to VideoPress
	 */
	if ( ! src && ! fileForUpload ) {
		return (
			<>
				{ blockSettings }
				<div { ...blockProps }>
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
				</div>
			</>
		);
	}

	// 2 - Uploading file to VideoPress infrastructure
	if ( fileForUpload ) {
		return (
			<VideoPressBlockProvider onUploadFinished={ videoPressUploadingFinished }>
				<ResumableUpload file={ fileForUpload } />
			</VideoPressBlockProvider>
		);
	}

	// 3 - Generating video preview
	if ( isRequestingEmbedPreview || ! preview ) {
		return <Loading text={ __( 'Generating preview…', 'jetpack' ) } />;
	}

	// X - Show VideoPress player
	return <SandBox html={ html } scripts={ scripts } />;
}
