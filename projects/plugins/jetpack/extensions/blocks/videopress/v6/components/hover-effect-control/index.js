/**
 * External dependencies
 */
import { ToggleControl, RangeControl, PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { debounce } from 'lodash';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { VIDEO_AUTOPLAY_DURATION } from '../../constants';
import { renderControlLabelWithTooltip } from '../inspector-controls';

const debouncedOnChange = debounce( fn => fn(), 250 );

export default function HoverEffectControl( { attributes, setAttributes, videoDuration } ) {
	const { hoverEffect, hoverEffectPlaybackAt } = attributes;
	const [ hoverEffectStartingTime, setStartingTime ] = useState( hoverEffectPlaybackAt );

	const onStartingTimeChange = useCallback(
		newTime => {
			setStartingTime( newTime );
			debouncedOnChange( () => setAttributes( { hoverEffectPlaybackAt: newTime } ) );
		},
		[ setAttributes ]
	);

	return (
		<PanelBody title={ __( 'Hover Effect Settings', 'jetpack' ) }>
			<ToggleControl
				label={ renderControlLabelWithTooltip(
					__( 'Enable Hover Effect', 'jetpack' ),
					/* translators: Tooltip describing the "hover effect" option for the VideoPress player */
					__( 'Start playing the video when hovering over it', 'jetpack' )
				) }
				onChange={ newValue => {
					setAttributes( { hoverEffect: newValue } );
				} }
				checked={ hoverEffect }
			/>

			{ hoverEffect && (
				<RangeControl
					label={ renderControlLabelWithTooltip(
						__( 'Playback start time', 'jetpack' ),
						/* translators: Tooltip describing the "starting time" option for the VideoPress player */
						__( 'The time at which the video will start playing', 'jetpack' )
					) }
					min={ 0 }
					max={ videoDuration ? videoDuration - VIDEO_AUTOPLAY_DURATION : hoverEffectStartingTime }
					initialPosition={ 0 }
					value={ hoverEffectStartingTime }
					onChange={ onStartingTimeChange }
					withInputField={ false }
				/>
			) }
		</PanelBody>
	);
}
