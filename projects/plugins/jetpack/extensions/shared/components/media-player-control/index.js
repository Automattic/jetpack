/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	ControlBackFiveIcon,
	ControlForwardFiveIcon,
	ControlPlayInTimeIcon,
} from '../../icons';
import { STATE_PAUSED, STORE_ID } from '../../../store/media-source/constants';
import { convertSecondsToTimeCode } from './utils';

function noop () {}

export function MediaPlayerControl( {
	skipForwardTime = 5,
	jumpBackTime = 5,
	customTimeToPlay,
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
	} = useSelect( select => {
		const {
			getMediaSourceCurrentTime,
			getMediaPlayerState,
			getDefaultMediaSource,
		} = select( STORE_ID );

		return {
			playerState: getMediaPlayerState(),
			playerCurrentTime: getMediaSourceCurrentTime(),
			defaultMediaSource: getDefaultMediaSource(),
		};
	}, [] );

	const timeInFormat = convertSecondsToTimeCode( playerCurrentTime );
	const isDisabled = ! defaultMediaSource;

	const {
		toggleMediaSource,
		playMediaSource,
		setMediaSourceCurrentTime,
	} = useDispatch( STORE_ID );
	const togglePlayer = () => toggleMediaSource( defaultMediaSource.id );

	function playPlayerInCustomTime() {
		setMediaSourceCurrentTime( defaultMediaSource.id, customTimeToPlay );
		playMediaSource( defaultMediaSource.id );
	}

	return (
		<>
			{ jumpBackTime !== false && (
				<ToolbarButton
					icon={ backFiveIcon }
					isDisabled={ isDisabled }
					onClick={ () => onTimeChange( playerCurrentTime - jumpBackTime ) }
				/>
			) }

			<ToolbarButton
				icon={ playerState === STATE_PAUSED ? playIcon : pauseIcon }
				isDisabled={ isDisabled }
				onClick={ togglePlayer }
			/>

			{ customTimeToPlay !== false && (
				<ToolbarButton
					icon={ ControlPlayInTimeIcon }
					isDisabled={ isDisabled }
					onClick={ playPlayerInCustomTime }
				/>
			) }

			{ skipForwardTime && (
				<ToolbarButton
					icon={ forwardFiveIcon }
					isDisabled={ isDisabled }
					onClick={ () => onTimeChange( playerCurrentTime + skipForwardTime ) }
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
