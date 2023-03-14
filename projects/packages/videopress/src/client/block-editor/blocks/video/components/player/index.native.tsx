/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { SandBox } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { View, Text } from 'react-native';

/**
 * VideoPlayer react component
 *
 * @param {object} props - Component props.
 * @param {string} props.html - HTML markup for the player.
 * @param {boolean} props.isRequestingEmbedPreview - Whether the preview is being requested.
 * @returns {object}                     - React component.
 */
export default function Player( { html, isRequestingEmbedPreview } ) {
	// If we don't have `html` then the embed player is loading.
	const loadingVideoPlayer = ! html;

	return (
		<View>
			{ ! isRequestingEmbedPreview && <SandBox html={ html } /> }
			{ loadingVideoPlayer && <Text>{ __( 'Loading…', 'jetpack-videopress-pkg' ) }</Text> }
		</View>
	);
}
