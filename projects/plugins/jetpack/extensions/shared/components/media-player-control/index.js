import { ToolbarGroup, ToolbarButton, ToolbarItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import './style.scss';
import { STATE_PAUSED, STORE_ID } from '../../../store/media-source/constants';
import { ControlBackFiveIcon, ControlForwardFiveIcon } from '../../icons';
import { convertSecondsToTimeCode } from './utils';

export function MediaPlayerControl( {
	skipForwardTime = 5,
	jumpBackTime = 5,
	playIcon = 'controls-play',
	pauseIcon = 'controls-pause',
	jumpBackIcon = ControlBackFiveIcon,
	skipForwardIcon = ControlForwardFiveIcon,
	currenTimeDisplay = true,
	onTimestampClick,
} ) {
	const { playerState, mediaCurrentTime, defaultMediaSource, mediaDomReference } = useSelect(
		select => {
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
		},
		[]
	);

	const timeInFormat = convertSecondsToTimeCode( mediaCurrentTime );
	const isDisabled = ! defaultMediaSource;

	const { toggleMediaSource, setMediaSourceCurrentTime } = useDispatch( STORE_ID );

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
				<ToolbarButton
					className={ clsx( 'media-player-control__current-time', {
						'is-disabled': isDisabled,
					} ) }
					label={ __( 'Set timestamp', 'jetpack' ) }
					onClick={ () => onTimestampClick( mediaCurrentTime ) }
				>
					{ timeInFormat }
				</ToolbarButton>
			) }
		</>
	);
}

export function MediaPlayerToolbarControl( props ) {
	return (
		<ToolbarGroup className="media-player-control__toolbar">
			<ToolbarItem>{ () => <MediaPlayerControl { ...props } /> }</ToolbarItem>
		</ToolbarGroup>
	);
}
