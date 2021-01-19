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
import { useRef, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import './style.scss';
import {
	ControlBackFiveIcon,
	ControlForwardFiveIcon,
	ControlPlayInTimeIcon,
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
} ) {
	const {
		playerState,
		mediaCurrentTime,
		mediaDuration,
		defaultMediaSource,
	} = useSelect( select => {
		const {
			getMediaSourceCurrentTime,
			getMediaPlayerState,
			getDefaultMediaSource,
			getMediaSourceDuration,
		} = select( STORE_ID );

		return {
			playerState: getMediaPlayerState(),
			mediaCurrentTime: getMediaSourceCurrentTime(),
			mediaDuration: getMediaSourceDuration(),
			defaultMediaSource: getDefaultMediaSource(),
		};
	}, [] );

	const [ progressBarValue, setProgressBarValue ] = useState( 0 );
	const prevSyncMode = useRef();

	const timeInFormat = convertSecondsToTimeCode( mediaCurrentTime );
	const isDisabled = ! defaultMediaSource;

	const {
		toggleMediaSource,
		playMediaSource,
		setMediaSourceCurrentTime,
	} = useDispatch( STORE_ID );

	function togglePlayer() {
		toggleMediaSource( defaultMediaSource.id );
	}

	function playPlayer() {
		playMediaSource( defaultMediaSource.id );
	}

	function setPlayerCurrentTime( time ) {
		setMediaSourceCurrentTime( defaultMediaSource.id, time );
	}

	function playPlayerInCustomTime() {
		setPlayerCurrentTime( customTimeToPlay );
		setProgressBarValue( customTimeToPlay ); // <- update currebt bar immediately.
		playPlayer();
	}

	function setCurrentTime( time ) {
		onTimeChange( time );
	}

	/*
	 * Syncornize current-time player with block property.
	 */
	// useEffect( () => {
	// 	setProgressBarValue( mediaCurrentTime );

	// 	if ( ! syncMode ) {
	// 		return;
	// 	}

	// 	// onTimeChange( mediaCurrentTime );
	// }, [ syncMode, mediaCurrentTime, onTimeChange, playerState ] );

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

			<ToolbarButton
				icon={ playerState === STATE_PAUSED ? playIcon : pauseIcon }
				isDisabled={ isDisabled }
				onClick={ togglePlayer }
				label={ __( 'Play', 'jetpack' ) }
			/>

			{ customTimeToPlay !== false && (
				<ToolbarButton
					icon={ ControlPlayInTimeIcon }
					isDisabled={ isDisabled }
					onClick={ playPlayerInCustomTime }
					label={ __( 'Play in custom time', 'jetpack' ) }
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
					isDisabled={ isDisabled }
					onClick={ () => onSyncModeToggle( ! syncMode ) }
					label={ __( 'Keep in-sync mode', 'jetpack' ) }
				/>
			) }

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
						onMouseDown={ () => {
							prevSyncMode.current = syncMode;
							onSyncModeToggle( false );
						} }
						onMouseUp={ () => {
							setPlayerCurrentTime( progressBarValue );
							if ( prevSyncMode.current ) {
								onTimeChange( progressBarValue );
								onSyncModeToggle( prevSyncMode.current );
							}
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
