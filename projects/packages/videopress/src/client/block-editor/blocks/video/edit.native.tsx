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
import DetailsPanel from './components/details-panel';
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
	/**
	 * TODO: The current components are intended to act as placeholders while block is in development.
	 * They should eventually be edited or replaced to support VideoPress.
	 */
	const { guid } = attributes;

	const [ isUploadingFile, setIsUploadingFile ] = useState( ! guid );

	const handleDoneUpload = useCallback(
		newVideoData => {
			setIsUploadingFile( false );
			setAttributes( { id: newVideoData.id, guid: newVideoData.guid } );
		},
		[ setIsUploadingFile, setAttributes ]
	);

	if ( isUploadingFile ) {
		return (
			<VideoPressUploader
				handleDoneUpload={ handleDoneUpload }
				isInteractionDisabled={ ! isSelected }
			/>
		);
	}

	return (
		<View style={ style[ 'wp-block-jetpack-videopress__container' ] }>
			{ isSelected && (
				<InspectorControls>
					<DetailsPanel { ...{ attributes, setAttributes } } />
				</InspectorControls>
			) }
			<View style={ style[ 'wp-block-jetpack-videopress__video-player' ] } />
		</View>
	);
}
