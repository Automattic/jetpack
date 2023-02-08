/**
 * WordPress dependencies
 */
import { MediaPlaceholder, VideoPlayer } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';
/**
 * Internal dependencies
 */
import { VideoPressIcon as icon } from './components/icons';
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from './constants';
import style from './style.scss';

/**
 * VideoPress block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected     - Whether the block is selected.
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

	const { src } = attributes;

	/**
	 * Function to set attributes upon media upload
	 *
	 * @param {object} attributes     - Attributes associated with uploaded video.
	 * @param {string} attributes.id  - Unique ID associated with video.
	 * @param {string} attributes.url - URL associated with video.
	 */
	function onSelectMediaUploadOption( { id, url } ) {
		setAttributes( { id, src: url } );
	}

	if ( ! attributes.id ) {
		return (
			<View style={ { flex: 1 } }>
				<MediaPlaceholder
					allowedTypes={ VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES }
					onSelect={ onSelectMediaUploadOption }
					icon={ icon }
				/>
			</View>
		);
	}

	return (
		<View style={ style[ 'wp-block-jetpack-videopress__container' ] }>
			<VideoPlayer
				isSelected={ isSelected }
				style={ style[ 'wp-block-jetpack-videopress__video-player' ] }
				source={ { uri: src } }
				paused={ true }
			/>
		</View>
	);
}
