/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { STATE_ERROR, STATE_PLAYING } from '../../../store/media-source/constants';
import Track from './track';

const Playlist = memo( ( { playerId, tracks, selectTrack, currentTrack, playerState, colors } ) => {
	return (
		<ol
			className="jetpack-podcast-player__tracks"
			aria-labelledby={ `jetpack-podcast-player__tracklist-title--${ playerId }` }
			aria-describedby={ `jetpack-podcast-player__tracklist-description--${ playerId }` }
		>
			{ tracks.map( ( track, index ) => {
				const isActive = currentTrack === index;

				return (
					<Track
						key={ track.id }
						index={ index }
						track={ track }
						selectTrack={ selectTrack }
						isActive={ isActive }
						isPlaying={ isActive && playerState === STATE_PLAYING }
						isError={ isActive && playerState === STATE_ERROR }
						colors={ colors }
					/>
				);
			} ) }
		</ol>
	);
} );

export default Playlist;
