/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { useState, useCallback } from '@wordpress/element';
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
import DetailsPanel from './components/details-panel';
import Player from './components/player';
import VideoPressUploader from './components/videopress-uploader/index.native';
import style from './style.scss';

/**
 * VideoPress block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected	 - Whether block is selected.
 * @returns {React.ReactNode}            - React component.
 */
export default function VideoPressEdit( {
	attributes,
	setAttributes,
	isSelected,
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

	if ( isUploadingFile ) {
		return <VideoPressUploader handleDoneUpload={ handleDoneUpload } />;
	}

	return (
		<View style={ style[ 'wp-block-jetpack-videopress__container' ] }>
			{ isSelected && (
				<InspectorControls>
					<DetailsPanel { ...{ attributes, setAttributes } } />
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
