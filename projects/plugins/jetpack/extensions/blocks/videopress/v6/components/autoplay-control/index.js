/**
 * External dependencies
 */
import { PanelBody, ToggleControl, RangeControl } from '@wordpress/components';
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

export default function AutoplayControl( { attributes, setAttributes, videoDuration } ) {
	const { autoplay, autoplayHovering, autoplayHoveringStart } = attributes;
	const [ startingTime, setStartingTime ] = useState( autoplayHoveringStart );

	/* translators: Tooltip describing the "autoplay-hovering" option for the VideoPress player */
	const autoplayHoveringHelp = __( 'Play automatically when hovering over it', 'jetpack' );

	const onStartingTimeChange = useCallback(
		newTime => {
			setStartingTime( newTime );
			debouncedOnChange( () => setAttributes( { autoplayHoveringStart: newTime } ) );
		},
		[ setAttributes ]
	);

	return (
		<PanelBody title={ __( 'Autoplay Settings', 'jetpack' ) }>
			<ToggleControl
				label={ renderControlLabelWithTooltip(
					__( 'Autoplay', 'jetpack' ),
					/* translators: Tooltip describing the "autoplay" option for the VideoPress player */
					__( 'Start playing the video as soon as the page loads', 'jetpack' )
				) }
				onChange={ newValue => {
					setAttributes( { autoplay: newValue } );
				} }
				checked={ autoplay }
				help={
					autoplay
						? __(
								'Note: Autoplaying videos may cause usability issues for some visitors.',
								'jetpack'
						  )
						: null
				}
			/>

			<RangeControl
				min={ 0 }
				max={ videoDuration ? videoDuration - VIDEO_AUTOPLAY_DURATION : startingTime }
				initialPosition={ 0 }
				value={ startingTime }
				onChange={ onStartingTimeChange }
				withInputField={ false }
			/>

			{ autoplay && (
				<ToggleControl
					label={ renderControlLabelWithTooltip(
						__( 'Autoplay when hovering', 'jetpack' ),
						autoplayHoveringHelp
					) }
					onChange={ newValue => {
						setAttributes( { autoplayHovering: newValue } );
					} }
					checked={ autoplayHovering }
					help={ autoplayHoveringHelp }
				/>
			) }
		</PanelBody>
	);
}
