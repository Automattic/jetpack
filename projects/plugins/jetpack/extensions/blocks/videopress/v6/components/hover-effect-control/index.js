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
	Icon,
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
import { convertSecondsToTimeCode } from '../../utils/time';
import { Clock } from '../icons';
import { renderControlLabelWithTooltip } from '../inspector-controls';
import './style.scss';

const debouncedOnChange = debounce( fn => fn(), 250 );
const debouncedOnChange25 = debounce( fn => fn(), 25 );

export default function HoverEffectControl( { attributes, setAttributes, videoDuration = 100 } ) {
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

	const [ showInputControls, setShowInputControls ] = useState( false );

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
			debouncedOnChange25( () => setAttributes( { hoverEffectPlaybackAt: newTime } ) );
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
				<FlexItem className="components-time-control__header-title">
					<ToggleControl
						label={ renderControlLabelWithTooltip(
							__( 'Hover Effect', 'jetpack' ),
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
							label={ __( 'Show input controls', 'jetpack' ) }
							icon={ settings }
							onClick={ () => {
								setShowInputControls( ! showInputControls );
							} }
							isPressed={ showInputControls }
							isSmall
						/>
					</FlexItem>
				) }
			</Flex>

			{ hoverEffect && (
				<Flex justify="left" className="components-time-control__info-pane">
					<Icon icon={ Clock } />
					<FlexItem>
						<span className="components-time-control__block-hhmmss">
							{ convertSecondsToTimeCode( hoverEffectStartingTime ).hhmmss }
						</span>
						<span className="components-time-control__block-decimal">
							.{ convertSecondsToTimeCode( hoverEffectStartingTime ).decimal }
						</span>
					</FlexItem>
					<FlexItem>/</FlexItem>
					<FlexItem>
						<span className="components-time-control__block-hhmmss">
							{ convertSecondsToTimeCode( videoDuration ).hhmmss }
						</span>
						<span className="components-time-control__block-decimal">
							.{ convertSecondsToTimeCode( videoDuration ).decimal }
						</span>
					</FlexItem>
				</Flex>
			) }

			{ typeof videoDuration !== 'undefined' && hoverEffect && showInputControls && (
				<Flex justify="space-between" className="components-time-control__body">
					<FlexItem className="components-time-control__hh_control">
						<div>{ __( 'HH', 'jetpack' ) }</div>
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

					<FlexItem className="components-time-control__mm_control">
						<div>{ __( 'MM', 'jetpack' ) }</div>
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

					<FlexItem className="components-time-control__ss_control">
						<div>{ __( 'SS', 'jetpack' ) }</div>
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

					<FlexItem className="components-time-control__hundredths_control">
						<div>{ __( '1/100', 'jetpack' ) }</div>
						<TextControl
							type="number"
							min={ 0 }
							max={ 99 }
							value={ hoverEffectPlaybackAtHundredths }
							onChange={ onStartingTimeHundredthsChange }
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
									[ ...Array( ( ( videoDuration / 60 ) | 0 ) + 1 ).keys() ].map( i => {
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
