/**
 * WordPress dependencies
 */
import { InspectorControls, store as blockEditorStore } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../../../lib/url';
import { usePreview } from '../../hooks/use-preview';
import ColorPanel from './components/color-panel';
import DetailsPanel from './components/details-panel';
import PlaybackPanel from './components/playback-panel';
import Player from './components/player';
import PrivacyAndRatingPanel from './components/privacy-and-rating-panel';
import VideoPressUploader from './components/videopress-uploader/index.native';
import style from './style.scss';

/**
 * VideoPress block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {object} props.clientId        - Block client Id.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected	 - Whether block is selected.
 * @param {Function} props.onFocus       - Callback to notify when block should gain focus.
 * @returns {React.ReactNode}            - React component.
 */
export default function VideoPressEdit( {
	attributes,
	clientId,
	setAttributes,
	isSelected,
	onFocus,
} ): React.ReactNode {
	const {
		autoplay,
		controls,
		guid,
		loop,
		muted,
		playsinline,
		poster,
		preload,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
	} = attributes;

	const [ isUploadingFile, setIsUploadingFile ] = useState( ! guid );
	const wasBlockJustInserted = useSelect(
		select => select( blockEditorStore ).wasBlockJustInserted( clientId, 'inserter_menu' ),
		[ clientId ]
	);

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
		poster,
	} );

	const { preview, isRequestingEmbedPreview } = usePreview( videoPressUrl );

	const handleDoneUpload = useCallback(
		newVideoData => {
			setIsUploadingFile( false );
			setAttributes( { id: newVideoData.id, guid: newVideoData.guid } );
		},
		[ setIsUploadingFile, setAttributes ]
	);

	const onStartUpload = useCallback(
		media => {
			setAttributes( { id: media.id } );
		},
		[ setAttributes ]
	);

	if ( isUploadingFile ) {
		return (
			<VideoPressUploader
				autoOpenMediaUpload={ isSelected && wasBlockJustInserted }
				handleDoneUpload={ handleDoneUpload }
				isInteractionDisabled={ ! isSelected }
				onFocus={ onFocus }
				onStartUpload={ onStartUpload }
			/>
		);
	}

	return (
		<View style={ style[ 'wp-block-jetpack-videopress__container' ] }>
			{ isSelected && (
				<InspectorControls>
					<DetailsPanel { ...{ attributes, setAttributes } } />
					<PanelBody title={ __( 'More', 'jetpack-videopress-pkg' ) }>
						<PlaybackPanel { ...{ attributes, setAttributes } } />
						<ColorPanel { ...{ attributes, setAttributes } } />
						<PrivacyAndRatingPanel { ...{ attributes, setAttributes } } />
					</PanelBody>
				</InspectorControls>
			) }
			<Player
				html={ preview.html }
				isRequestingEmbedPreview={ isRequestingEmbedPreview }
				isSelected={ isSelected }
			/>
		</View>
	);
}
