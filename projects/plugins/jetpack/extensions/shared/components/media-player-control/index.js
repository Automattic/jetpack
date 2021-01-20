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
import { useRef, useState, useEffect } from '@wordpress/element';
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
	showTimeDisplay = true,
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
	const [ showProgressBarTooltip, setShowProgressBarTooltip ] = useState( false );
	const prevSyncMode = useRef();

	const timeInFormat = convertSecondsToTimeCode( mediaCurrentTime );
	const isDisabled = ! defaultMediaSource;
	const readyToEdit = typeof mediaDuration !== 'undefined';

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
		if ( mediaDomReference ) {
			mediaDomReference.currentTime = time;
		}
		setMediaSourceCurrentTime( defaultMediaSource.id, time );
	}

	function playPlayerInCustomTime() {
		setPlayerCurrentTime( customTimeToPlay );
		setProgressBarValue( customTimeToPlay ); // <- update currebt bar immediately.
		playPlayer();
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

	// Synchronize current-time player with block property.
	useEffect( () => {
		if ( ! syncMode ) {
			return;
		}

		if ( playerState !== STATE_PLAYING ) {
			return;
		}

		setProgressBarValue( mediaCurrentTime );
		onTimeChange( mediaCurrentTime );
	}, [ mediaCurrentTime, onTimeChange, syncMode, playerState ] );

	useEffect( () => {
		setProgressBarValue( customTimeToPlay );
		setShowProgressBarTooltip( false );
	}, [ customTimeToPlay ] );

	const disableCustomPlayButton = isDisabled || syncMode || Math.abs( customTimeToPlay - mediaCurrentTime ) < 1;

	return (
		<>
			{ jumpBackTime !== false && (
				<ToolbarButton
					icon={ backFiveIcon }
					disabled={ isDisabled || ! readyToEdit }
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
					isDisabled={ disableCustomPlayButton }
					onClick={ playPlayerInCustomTime }
					label={ __( 'Play in custom time', 'jetpack' ) }
				/>
			) }

			{ skipForwardTime && (
				<ToolbarButton
					icon={ forwardFiveIcon }
					disabled={ isDisabled || ! readyToEdit }
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

			{ showTimeDisplay && (
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
				<RangeControl
					value={ readyToEdit ? progressBarValue : 0 }
					className="media-player-control__progress-bar"
					min={ 0 }
					max={ readyToEdit ? mediaDuration : 100 }
					onChange={ setProgressBarValue }
					withInputField={ false }
					disabled={ isDisabled || ! readyToEdit }
					renderTooltipContent={ ( time ) => convertSecondsToTimeCode( time ) }
					showTooltip={ showProgressBarTooltip }
					onMouseDown={ () => {
						prevSyncMode.current = syncMode;
						setShowProgressBarTooltip( true );
						onSyncModeToggle( false );
					} }
					onMouseUp={ () => {
						onTimeChange( progressBarValue );
						setShowProgressBarTooltip( false );
						if ( prevSyncMode.current ) {
							setPlayerCurrentTime( progressBarValue );
							onSyncModeToggle( prevSyncMode.current );
						}
					} }
				/>
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
