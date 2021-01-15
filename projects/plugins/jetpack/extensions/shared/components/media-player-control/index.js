/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { ControlBackFiveIcon, ControlForwardFiveIcon } from '../../icons';
import { STATE_PAUSED, STATE_PLAYING } from '../../../store/media-source/constants';
import { convertSecondsToTimeCode } from './utils';

function noop () {};

export default function MediaPlayerControl( {
	time,
	state = STATE_PAUSED,
	skipForwardTime = 5,
	jumpBackTime = 5,
	playIcon = 'controls-play',
	pauseIcon = 'controls-pause',
	isDisabled = false,

	onTimeChange = noop,
	onToggle = noop,
} ) {
	const timeInFormat = convertSecondsToTimeCode( time );

	return (
		<ToolbarGroup>
			{ jumpBackTime !== false && (
				<ToolbarButton
					icon={ ControlBackFiveIcon }
					isDisabled={ isDisabled }
					onClick={ () => onTimeChange( time - jumpBackTime ) }
				/>
			) }
			
			<ToolbarButton
				icon={ state === STATE_PAUSED ? playIcon : pauseIcon }
				isDisabled={ isDisabled }
				onClick={ () => {
					if ( state === STATE_PLAYING ) {
						return onToggle && onToggle( STATE_PAUSED );
					}
					
					return onToggle( STATE_PLAYING );
				} }
			/>

			{ skipForwardTime && (
				<ToolbarButton
					icon={ ControlForwardFiveIcon }
					isDisabled={ isDisabled }
					onClick={ () => onTimeChange( time + skipForwardTime ) }
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