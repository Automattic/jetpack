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
/**
 * Internal dependencies
 */
import './style.scss';
import {
	ControlBackFiveIcon,
	ControlForwardFiveIcon,
} from '../../icons';
import { STATE_PAUSED, STORE_ID } from '../../../store/media-source/constants';
import { convertSecondsToTimeCode } from './utils';

export function MediaPlayerControl( {
	skipForwardTime = 5,
	jumpBackTime = 5,
	playIcon = 'controls-play',
	pauseIcon = 'controls-pause',
	jumpBackIcon = ControlBackFiveIcon,
	skipForwardIcon = ControlForwardFiveIcon,
	currenTimeDisplay = true,
} ) {
	const {
		playerState,
		mediaCurrentTime,
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

			{ currenTimeDisplay && (
				<div
					className={ classnames(
						'media-player-control__current-time', {
							'is-disabled': isDisabled,
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
