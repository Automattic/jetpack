/**
 * WordPress dependencies
 */
import { MediaPlaceholder } from '@wordpress/block-editor';
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
import { VideoPressIcon as icon } from './components/icons';
import VideoPressPlayer from './components/videopress-player';
import { VIDEOPRESS_VIDEO_ALLOWED_MEDIA_TYPES } from './constants';

/**
 * VideoPress block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @returns {React.ReactNode}            - React component.
 */
export default function VideoPressEdit( { attributes, setAttributes } ): React.ReactNode {
	/**
	 * TODO: The current components are intended to act as placeholders while block is in development.
	 * They should eventually be edited or replaced to support VideoPress.
	 */

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
	} = attributes;
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
	const { preview, isRequestingEmbedPreview } = usePreview( videoPressUrl );

	// Pick video properties from preview.
	const { html: previewHtml, scripts } = preview;

	const html = previewHtml || cacheHtml;

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
		<VideoPressPlayer
			html={ html }
			isRequestingEmbedPreview={ isRequestingEmbedPreview }
			scripts={ scripts }
			attributes={ attributes }
			preview={ preview }
		/>
	);
}
