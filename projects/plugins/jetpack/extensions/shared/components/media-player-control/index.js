/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton, RangeControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import './style.scss';
import {
	ControlBackFiveIcon,
	ControlForwardFiveIcon,
	ControlSyncIcon,
	ControlUnsyncIcon,
} from '../../icons';
import { STATE_PAUSED, STATE_PLAYING, STORE_ID } from '../../../store/media-source/constants';
import { convertSecondsToTimeCode } from './utils';

function noop () {}

export function MediaPlayerControl( {
	skipForwardTime = 5,
	jumpBackTime = 5,
	customTimeToPlay,
	syncMode,
	onSyncModeToggle = noop,
	playIcon = 'controls-play',
	pauseIcon = 'controls-pause',
	backFiveIcon = ControlBackFiveIcon,
	forwardFiveIcon = ControlForwardFiveIcon,
	onTimeChange = noop,
	progressBar = false,
	currenTimeDisplay = true,
	playButton = true,
} ) {
	const {
		playerState,
		mediaCurrentTime,
		mediaDuration,
		defaultMediaSource,
		mediaDomReference,
	} = useSelect( select => {
		const {
			getMediaSourceCurrentTime,
			getMediaPlayerState,
			getDefaultMediaSource,
			getMediaSourceDuration,
			getMediaSourceDomReference,
		} = select( STORE_ID );

		return {
			playerState: getMediaPlayerState(),
			mediaCurrentTime: getMediaSourceCurrentTime(),
			mediaDuration: getMediaSourceDuration(),
			defaultMediaSource: getDefaultMediaSource(),
			mediaDomReference: getMediaSourceDomReference(),
		};
	}, [] );

	const [ progressBarValue, setProgressBarValue ] = useState( customTimeToPlay );

	const timeInFormat = convertSecondsToTimeCode( mediaCurrentTime );
	const isDisabled = ! defaultMediaSource;

	const {
		toggleMediaSource,
		setMediaSourceCurrentTime,
	} = useDispatch( STORE_ID );

	function togglePlayer() {
		if ( playerState !== STATE_PLAYING ) {
			setPlayerCurrentTime( customTimeToPlay ); // <- move player to timestamp.
			setProgressBarValue( customTimeToPlay ); // <- update progress bar immediately.
		}
		toggleMediaSource( defaultMediaSource.id );
	}

	function setPlayerCurrentTime( time ) {
		if ( mediaDomReference ) {
			mediaDomReference.currentTime = time;
		}
		setMediaSourceCurrentTime( defaultMediaSource.id, time );
	}

	function setCurrentTime( time ) {
		onTimeChange( time );
		if ( syncMode ) {
			if ( mediaDomReference ) {
				mediaDomReference.currentTime = time;
			}
			setPlayerCurrentTime( time );
		}
	}

	return (
		<>
			{ jumpBackTime !== false && (
				<ToolbarButton
					icon={ backFiveIcon }
					isDisabled={ isDisabled }
					onClick={ () => setCurrentTime( customTimeToPlay - jumpBackTime ) }
					label={ __( 'Jump back', 'jetpack' ) }
				/>
			) }

			{ playButton && (
				<ToolbarButton
					icon={ playerState === STATE_PAUSED ? playIcon : pauseIcon }
					isDisabled={ isDisabled }
					onClick={ togglePlayer }
					label={ __( 'Play', 'jetpack' ) }
				/>
			) }

			{ skipForwardTime && (
				<ToolbarButton
					icon={ forwardFiveIcon }
					isDisabled={ isDisabled }
					onClick={ () => setCurrentTime( customTimeToPlay + skipForwardTime ) }
					label={ __( 'Skip forward', 'jetpack' ) }
				/>
			) }

			{ typeof syncMode !== 'undefined' && (
				<ToolbarButton
					icon={ syncMode ? ControlUnsyncIcon : ControlSyncIcon }
					disabled={ isDisabled || ! mediaDuration }
					onClick={ () => onSyncModeToggle( ! syncMode ) }
					label={ __( 'Keep in-sync mode', 'jetpack' ) }
				/>
			) }

			{ currenTimeDisplay && (
				<div
					className={ classnames(
						'media-player-control__current-time', {
							'is-disabled': isDisabled,
							[ `has-${ timeInFormat.split( ':' ) }-parts` ]: true
						}
					) }
				>
					{ timeInFormat }
				</div>
			) }

			{ progressBar && (
				<>
					<div className="break" />
					<RangeControl
						value={ progressBarValue }
						className="media-player-control__progress-bar"
						min={ 0 }
						max={ mediaDuration }
						onChange={ setProgressBarValue }
						withInputField={ false }
						disabled={ isDisabled || ! mediaDuration }
						renderTooltipContent={ ( time ) => convertSecondsToTimeCode( time ) }
						onMouseUp={ () => {
							onTimeChange( progressBarValue );
						} }
					/>
				</>
			) }
		</>
	);
}

export function MediaPlayerToolbarControl( props ) {
	return (
		<ToolbarGroup>
			<MediaPlayerControl { ...props } />
		</ToolbarGroup>
	);
}
