/* global mejs */

/**
 * External dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { controlBackFive, controlForwardFive } from '../../../shared/icons';
import { STATE_PAUSED, STATE_PLAYING, STORE_ID } from '../../../store/media-source/constants';

export default function MediaPlayerControl( {
	timestamp,
	onTimeChange,
} ) {
	const { mediaId, playerState } = useSelect( select => {
		const { getDefaultMediaSource } = select( STORE_ID );
		const mediaSource = getDefaultMediaSource();

		return {
			mediaId: mediaSource?.id,
			playerState: mediaSource?.state,
			// currentMediaSource: getCurrent(),
			// state: getMediaStatus( currentMediaId ),
		};
	}, [] );

	const {
		playMediaSourceInCurrentTime,
		pauseMediaSource,
	} = useDispatch( STORE_ID );
	// const toggleMedia = () => toggleMediaSource( mediaId );
	// const moveOffset = ( offset ) => {
	// 	let pos = mejs.Utils.timeCodeToSeconds( timestamp ) + offset;
	// 	if ( pos < 0 ) {
	// 		pos = 0;
	// 	}

	// 	onTimeChange( { timestamp: mejs.Utils.secondsToTimeCode( pos ) } );
	// 	setMediaPosition( mediaId, pos );
	// };

	if ( ! mediaId ) {
		return null;
	}

	return (
		<ToolbarGroup>
			<ToolbarButton
				icon={ controlBackFive }
				onClick={ console.log }
			/>

			<ToolbarButton
				icon={ playerState === STATE_PAUSED
					? 'controls-play'
					: 'controls-pause'
				}
				onClick={ () => {
					if ( playerState === STATE_PLAYING ) {
						return pauseMediaSource( mediaId );
					}
					const currentTime = mejs.Utils.timeCodeToSeconds( timestamp );
					playMediaSourceInCurrentTime( mediaId, currentTime );
				} }
			/>
			<ToolbarButton
				icon={ controlForwardFive }
				onClick={ console.log }
			/>
		</ToolbarGroup>
	);
}
