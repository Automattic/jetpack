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
import { useState } from '@wordpress/element';
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
import { STATE_PAUSED, STORE_ID } from '../../../store/media-source/constants';
import { convertSecondsToTimeCode } from './utils';

function noop () {}

export function MediaPlayerControl( {
	skipForwardTime = 5,
	jumpBackTime = 5,
	customTimeToPlay,
	syncMode = false,
	playIcon = 'controls-play',
	pauseIcon = 'controls-pause',
	backFiveIcon = ControlBackFiveIcon,
	forwardFiveIcon = ControlForwardFiveIcon,
	onTimeChange = noop,
} ) {
	const {
		playerState,
		playerCurrentTime,
		defaultMediaSource,
		syncModeEnabled,
	} = useSelect( select => {
		const {
			getMediaSourceCurrentTime,
			getMediaPlayerState,
			getMediaSourceSyncMode,
			getDefaultMediaSource,
		} = select( STORE_ID );

		return {
			playerState: getMediaPlayerState(),
			playerCurrentTime: getMediaSourceCurrentTime(),
			syncModeEnabled: getMediaSourceSyncMode(),
			defaultMediaSource: getDefaultMediaSource(),
		};
	}, [] );
	const timeInFormat = convertSecondsToTimeCode( playerCurrentTime );
	const isDisabled = ! defaultMediaSource;

	const {
		toggleMediaSource,
		playMediaSource,
		setMediaSourceCurrentTime,
		setMediaSourceSyncMode,
	} = useDispatch( STORE_ID );

	function togglePlayer() {
		toggleMediaSource( defaultMediaSource.id );
	}

	function setSyncMode( enabled ) {
		setMediaSourceSyncMode( defaultMediaSource.id, enabled );
	}

	function playPlayerInCustomTime() {
		setMediaSourceCurrentTime( defaultMediaSource.id, customTimeToPlay );
		playMediaSource( defaultMediaSource.id );
	}

	function setCurrentTime( time ) {
		onTimeChange( time );
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

			{ syncMode && (
				<ToolbarButton
					icon={ syncModeEnabled ? ControlUnsyncIcon : ControlSyncIcon }
					isDisabled={ isDisabled }
					onClick={ () => setSyncMode( ! syncModeEnabled ) }
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
