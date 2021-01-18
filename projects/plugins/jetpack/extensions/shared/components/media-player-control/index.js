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
import { ControlBackFiveIcon, ControlForwardFiveIcon } from '../../icons';
import { STATE_PAUSED, STATE_PLAYING, STORE_ID } from '../../../store/media-source/constants';
import { convertSecondsToTimeCode } from './utils';

function noop () {};

export default function MediaPlayerControl( {
	skipForwardTime = 5,
	jumpBackTime = 5,
	playIcon = 'controls-play',
	pauseIcon = 'controls-pause',
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
		}
	}, [] );

	const timeInFormat = convertSecondsToTimeCode( playerCurrentTime );
	const isDisabled = ! defaultMediaSource;

	const { toggleMediaSource } = useDispatch( STORE_ID );
	const togglePlayer = () => toggleMediaSource( defaultMediaSource.id );

	return (
		<ToolbarGroup>
			{ jumpBackTime !== false && (
				<ToolbarButton
					icon={ ControlBackFiveIcon }
					isDisabled={ isDisabled }
					onClick={ () => onTimeChange( playerCurrentTime - jumpBackTime ) }
				/>
			) }
			
			<ToolbarButton
				icon={ playerState === STATE_PAUSED ? playIcon : pauseIcon }
				isDisabled={ isDisabled }
				onClick={ togglePlayer }
			/>

			{ skipForwardTime && (
				<ToolbarButton
					icon={ ControlForwardFiveIcon }
					isDisabled={ isDisabled }
					onClick={ () => onTimeChange( playerCurrentTime + skipForwardTime ) }
				/>
			) }
			
			<ToolbarButton>
				<div
					className={ classnames( 
						'media-player-control__current-time', {
							[ `has-${ timeInFormat.split( ':' ) }-parts` ]: true
						}
					) }
				>
					{ timeInFormat }
				</div>
			</ToolbarButton>
		</ToolbarGroup>
	);
}