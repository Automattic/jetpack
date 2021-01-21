/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
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
	syncMode,
	onSyncModeToggle,
	playIcon = 'controls-play',
	pauseIcon = 'controls-pause',
	jumpBackIcon = ControlBackFiveIcon,
	skipForwardIcon = ControlForwardFiveIcon,
	onTimeChange = noop,
	currenTimeDisplay = true,
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

	useEffect( () => {
		if ( ! syncMode ) {
			return;
		}

		if ( playerState !== STATE_PLAYING ) {
			return;
		}

		onTimeChange( mediaCurrentTime );
	}, [ mediaCurrentTime, onTimeChange, playerState, syncMode ] );

	const timeInFormat = convertSecondsToTimeCode( mediaCurrentTime );
	const isDisabled = ! defaultMediaSource;

	const {
		toggleMediaSource,
		setMediaSourceCurrentTime,
	} = useDispatch( STORE_ID );

	function togglePlayer() {
		toggleMediaSource( defaultMediaSource.id );
	}

	function setPlayerCurrentTime( time ) {
		if ( mediaDomReference ) {
			mediaDomReference.currentTime = time;
		}
		setMediaSourceCurrentTime( defaultMediaSource.id, time );
	}

	function setCurrentTime( time ) {
		setPlayerCurrentTime( time );
		if ( mediaDomReference ) {
			mediaDomReference.currentTime = time;
		}

		if ( syncMode ) {
			onTimeChange( time );
		}
	}

	return (
		<>
			{ jumpBackTime !== false && (
				<ToolbarButton
					icon={ jumpBackIcon }
					isDisabled={ isDisabled }
					onClick={ () => setCurrentTime( mediaCurrentTime - jumpBackTime ) }
					label={ __( 'Jump back', 'jetpack' ) }
				/>
			) }

			<ToolbarButton
				icon={ playerState === STATE_PAUSED ? playIcon : pauseIcon }
				isDisabled={ isDisabled }
				onClick={ togglePlayer }
				label={ __( 'Play', 'jetpack' ) }
			/>

			{ skipForwardTime && (
				<ToolbarButton
					icon={ skipForwardIcon }
					isDisabled={ isDisabled }
					onClick={ () => setCurrentTime( mediaCurrentTime + skipForwardTime ) }
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
