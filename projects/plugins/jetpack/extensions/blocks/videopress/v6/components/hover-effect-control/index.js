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
	const hoverEffectPlaybackAtSeconds = isNaN( hoverEffectStartingTime )
		? 0
		: ( hoverEffectStartingTime | 0 ) % 60;

	const hoverEffectPlaybackAtMinutes = isNaN( hoverEffectStartingTime )
		? 0
		: Math.floor( ( hoverEffectStartingTime | 0 ) / 60 );

	const hoverEffectPlaybackAtHours = isNaN( hoverEffectStartingTime )
		? 0
		: Math.floor( ( hoverEffectStartingTime | 0 ) / 3600 );

	const hoverEffectPlaybackAtHundredths = isNaN( hoverEffectStartingTime )
		? 0
		: Math.floor( ( hoverEffectStartingTime * 100 ) % 100 );

	const [ timeControlMode, setTimeControlMode ] = useState( 'draggable' );

	const onStartingTimeChange = useCallback(
		newTimeInteger => {
			const newTime = newTimeInteger + hoverEffectPlaybackAtHundredths / 100;
			setStartingTime( newTime );
			debouncedOnChange( () => setAttributes( { hoverEffectPlaybackAt: newTime } ) );
		},
		[ setAttributes, hoverEffectPlaybackAtHundredths ]
	);

	const onStartingTimeHundredthsChange = useCallback(
		newHundredths => {
			const newTime =
				hoverEffectPlaybackAtHours * 3600 +
				hoverEffectPlaybackAtMinutes * 60 +
				hoverEffectPlaybackAtSeconds +
				newHundredths / 100;

			setStartingTime( newTime );
			debouncedOnChange( () => setAttributes( { hoverEffectPlaybackAt: newTime } ) );
		},
		[
			hoverEffectPlaybackAtHours,
			hoverEffectPlaybackAtMinutes,
			hoverEffectPlaybackAtSeconds,
			setAttributes,
		]
	);

	return (
		<fieldset className="components-time-control">
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

			{ typeof videoDuration !== 'undefined' && hoverEffect && timeControlMode === 'inputs' && (
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
										hoverEffectPlaybackAtSeconds +
										hoverEffectPlaybackAtHundredths
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
										hoverEffectPlaybackAtSeconds +
										hoverEffectPlaybackAtHundredths
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
										parseInt( nextSeconds ) +
										hoverEffectPlaybackAtHundredths
								);
							} }
							disabled={ isNaN( hoverEffectPlaybackAt ) }
						/>
					</FlexItem>
				</Flex>
			) }

			{ hoverEffect && (
				<>
					<Flex justify="space-between" className="components-time-control__body">
						<FlexBlock>
							<RangeControl
								min={ 0 }
								max={
									videoDuration ? videoDuration - VIDEO_AUTOPLAY_DURATION : hoverEffectStartingTime
								}
								initialPosition={ 0 }
								value={ hoverEffectStartingTime | 0 }
								onChange={ onStartingTimeChange }
								withInputField={ false }
								marks={
									videoDuration &&
									[ ...Array( ( videoDuration / 60 ) | 0 ).keys() ].map( i => {
										return {
											value: i * 60,
											label: `${ i }m`,
										};
									} )
								}
								disabled={ typeof videoDuration === 'undefined' }
							/>
						</FlexBlock>
					</Flex>

					<RangeControl
						min={ 0 }
						max={ 99 }
						initialPosition={ 0 }
						value={ hoverEffectPlaybackAtHundredths }
						onChange={ onStartingTimeHundredthsChange }
						withInputField={ false }
						marks={ [ ...Array( 11 ).keys() ].map( i => {
							return {
								value: i * 10,
								label: `${ i * 10 }`,
							};
						} ) }
						disabled={ typeof videoDuration === 'undefined' }
					/>
				</>
			) }
		</fieldset>
	);
}
