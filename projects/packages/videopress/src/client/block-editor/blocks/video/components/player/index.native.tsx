/**
 * WordPress dependencies
 */
import { BlockCaption } from '@wordpress/block-editor';
import { SandBox } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
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
import type { NativePlayerProps } from './types';

/**
 * VideoPlayer react component
 *
 * @param {object} props - Component props.
 * @param {string} props.html - HTML markup for the player.
 * @param {boolean} props.isRequestingEmbedPreview - Whether the preview is being requested.
 * @param {boolean} props.isSelected - Whether the block is selected.
 * @param {string} props.clientId - Block client Id.
 * @param {Function} props.insertBlocksAfter - Function to insert a new block after the current block.
 * @returns {object}                     - React component.
 */
export default function Player( {
	html,
	isRequestingEmbedPreview,
	isSelected,
	clientId,
	insertBlocksAfter,
}: NativePlayerProps ) {
	const [ isCaptionSelected, setIsCaptionSelected ] = useState( false );

	const onFocusCaption = useCallback( () => {
		if ( ! isCaptionSelected ) {
			setIsCaptionSelected( true );
		}
	}, [ isCaptionSelected ] );

	const accessibilityLabelCreator = useCallback( caption => {
		if ( caption ) {
			return sprintf(
				/* translators: accessibility text. %s: Video caption. */
				__( 'Video caption. %s', 'jetpack-videopress-pkg' ),
				caption
			);
		}
		/* translators: accessibility text. Empty Video caption. */
		return __( 'Video caption. Empty', 'jetpack-videopress-pkg' );
	}, [] );

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

			{ isSelected && (
				<BlockCaption
					clientId={ clientId }
					onFocus={ onFocusCaption }
					isSelected={ isCaptionSelected }
					insertBlocksAfter={ insertBlocksAfter }
					accessibilityLabelCreator={ accessibilityLabelCreator }
					accessible
				/>
			) }
		</View>
	);
}
