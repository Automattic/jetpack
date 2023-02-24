/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { SandBox } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { View, Text } from 'react-native';

/**
 * VideoPlayer react component
 *
 * @param {object} props                 - Component props.
 * @param {object} props.html            - Player html to render in the sandbox.
 * @param {object} props.attributes      - Block attributes.
 * @param {Array} props.scripts          - Scripts to pass trough to the sandbox.
 * @param {object} props.preview         - oEmbed preview data.
 * @param {boolean} props.isRequestingEmbedPreview - oEmbed preview data.
 * @returns {object}                     - React component.
 */
export default function VideoPressPlayer( {
	html,
	attributes,
	scripts = [],
	preview,
	isRequestingEmbedPreview,
} ) {
	const [ videoPlayerHeight, setVideoPlayerHeight ] = useState( 250 );

	// Use preview aspect ratio if available. Otherwise, use the ratio from the attributes.
	const { height = 0, width = 1 } = preview;
	const videoRatio = ( height / width ) * 100 || attributes.videoRatio;

	// If we don't have `html` then the player is loading.
	const loadingVideoPlayer = ! html;

	const embedPreviewRequested = ! isRequestingEmbedPreview;

	// Scale video player height based on the video ratio and layout width.
	const scaleVideoPlayer = useCallback(
		( { layout } ) => !! videoRatio && setVideoPlayerHeight( ( layout.width * videoRatio ) / 100 ),
		[ videoRatio ]
	);

	return (
		<View
			style={ { height: videoPlayerHeight } }
			onLayout={ ( { nativeEvent } ) => scaleVideoPlayer( nativeEvent ) }
		>
			{ embedPreviewRequested && <SandBox html={ html } scripts={ scripts } /> }
			{ loadingVideoPlayer && <Text>{ __( 'Loading…', 'jetpack-videopress-pkg' ) }</Text> }
		</View>
	);
}
