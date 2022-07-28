/**
 * External dependencies
 */
import {
	ToggleControl,
	RangeControl,
	Flex,
	FlexItem,
	FlexBlock,
	Button,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import { debounce } from 'lodash';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { VIDEO_AUTOPLAY_DURATION } from '../../constants';
import { renderControlLabelWithTooltip } from '../inspector-controls';
import './style.scss';

const debouncedOnChange = debounce( fn => fn(), 250 );

export default function HoverEffectControl( { attributes, setAttributes, videoDuration } ) {
	const { hoverEffect, hoverEffectPlaybackAt } = attributes;
	const [ hoverEffectStartingTime, setStartingTime ] = useState( hoverEffectPlaybackAt );
	const [ timeControlMode, setTimeControlMode ] = useState( 'draggable' );

	const onStartingTimeChange = useCallback(
		newTime => {
			setStartingTime( newTime );
			debouncedOnChange( () => setAttributes( { hoverEffectPlaybackAt: newTime } ) );
		},
		[ setAttributes ]
	);

	const hoverEffectPlaybackAtSeconds = isNaN( hoverEffectStartingTime )
		? 0
		: hoverEffectStartingTime % 60;

	const hoverEffectPlaybackAtMinutes = isNaN( hoverEffectStartingTime )
		? 0
		: Math.floor( hoverEffectStartingTime / 60 );

	const hoverEffectPlaybackAtHours = isNaN( hoverEffectStartingTime )
		? 0
		: Math.floor( hoverEffectStartingTime / 3600 );

	return (
		<fieldset>
			<Flex justify="space-between" className="components-time-control__header">
				<FlexItem>
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
				</FlexItem>
				{ hoverEffect && (
					<FlexItem>
						<Button
							className="components-button is-small has-icon"
							label={
								timeControlMode === 'inputs'
									? __( 'Use inputs preset', 'jetpack' )
									: __( 'Use draggables preset', 'jetpack' )
							}
							icon={ settings }
							onClick={ () => {
								setTimeControlMode( timeControlMode === 'draggable' ? 'inputs' : 'draggable' );
							} }
							isPressed={ timeControlMode === 'inputs' }
							isSmall
						/>
					</FlexItem>
				) }
			</Flex>

			{ hoverEffect && timeControlMode === 'inputs' && (
				<Flex justify="space-between" className="components-time-control__body">
					<FlexItem>
						<TextControl
							type="number"
							min={ 0 }
							max={ 99 }
							value={ hoverEffectPlaybackAtHours }
							onChange={ nextHours => {
								onStartingTimeChange(
									parseInt( nextHours ) * 3600 +
										hoverEffectPlaybackAtMinutes * 60 +
										hoverEffectPlaybackAtSeconds
								);
							} }
						/>
					</FlexItem>

					<FlexItem>
						<TextControl
							type="number"
							min={ 0 }
							max={ 59 }
							value={ hoverEffectPlaybackAtMinutes }
							onChange={ nextMinutes => {
								onStartingTimeChange(
									hoverEffectPlaybackAtHours * 3600 +
										parseInt( nextMinutes ) * 60 +
										hoverEffectPlaybackAtSeconds
								);
							} }
							disabled={ isNaN( hoverEffectPlaybackAt ) }
						/>
					</FlexItem>

					<FlexItem>
						<TextControl
							type="number"
							min={ 0 }
							max={ 59 }
							value={ hoverEffectPlaybackAtSeconds }
							onChange={ nextSeconds => {
								onStartingTimeChange(
									hoverEffectPlaybackAtHours * 3600 +
										hoverEffectPlaybackAtMinutes * 60 +
										parseInt( nextSeconds )
								);
							} }
							disabled={ isNaN( hoverEffectPlaybackAt ) }
						/>
					</FlexItem>
				</Flex>
			) }

			{ hoverEffect && (
				<Flex justify="space-between" className="components-time-control__body">
					<FlexBlock>
						<RangeControl
							min={ 0 }
							max={
								videoDuration ? videoDuration - VIDEO_AUTOPLAY_DURATION : hoverEffectStartingTime
							}
							initialPosition={ 0 }
							value={ hoverEffectStartingTime }
							onChange={ onStartingTimeChange }
							withInputField={ false }
						/>
					</FlexBlock>
				</Flex>
			) }
		</fieldset>
	);
}
