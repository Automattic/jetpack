/**
 * WordPress dependencies
 */
import { SandBox } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { View, Text } from 'react-native';
/**
 * Internal dependencies
 */
import style from './style.scss';
/**
 * Types
 */
import type { PlayerProps } from './types';

type NativePlayerProps = Pick< PlayerProps, 'html' | 'isRequestingEmbedPreview' | 'isSelected' >;

/**
 * VideoPlayer react component
 *
 * @param {object} props - Component props.
 * @param {string} props.html - HTML markup for the player.
 * @param {boolean} props.isRequestingEmbedPreview - Whether the preview is being requested.
 * @param {boolean} props.isSelected - Whether the block is selected.
 * @returns {object}                     - React component.
 */
export default function Player( {
	html,
	isRequestingEmbedPreview,
	isSelected,
}: NativePlayerProps ) {
	// Set up style for when the player is loading.
	const loadingStyle: { height?: number } = {};
	if ( ! html || isRequestingEmbedPreview ) {
		loadingStyle.height = 250;
	}

	return (
		<View style={ [ style[ 'videopress-player' ], loadingStyle ] }>
			{ ! isSelected && <View style={ style[ 'videopress-player__overlay' ] } /> }

			{ ! isRequestingEmbedPreview && <SandBox html={ html } /> }
			{ ! html && <Text>{ __( 'Loading…', 'jetpack-videopress-pkg' ) }</Text> }
		</View>
	);
}
