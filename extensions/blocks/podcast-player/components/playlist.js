/**
 * External dependencies
 */
import classnames from 'classnames';
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { episodePlayingIcon, episodeErrorIcon } from '../icons';
import { STATE_ERROR, STATE_PLAYING } from '../constants';

const renderEpisodeIcon = ( isPlaying, isError ) => {
	if ( isError ) {
		return episodeErrorIcon;
	}

	if ( isPlaying ) {
		return episodePlayingIcon;
	}
};

const TrackError = memo( ( { link } ) => (
	<div className="jetpack-podcast-player__episode-error">
		{ __( 'Episode unavailable', 'jetpack' ) }{ ' ' }
		{ link && (
			<span>
				{ '(' }
				<a href={ link } rel="noopener noreferrer nofollow" target="_blank">
					{ __( 'Open in a new tab', 'jetpack' ) }
				</a>
				{ ')' }
			</span>
		) }
	</div>
) );

const Track = memo( ( { track, isActive, isPlaying, isError, selectTrack, index } ) => {
	return (
		<li
			className={ classnames( 'jetpack-podcast-player__episode', {
				'is-active': isActive,
			} ) }
		>
			<a
				className="jetpack-podcast-player__episode-link"
				href={ track.link }
				role="button"
				aria-pressed="false"
				onClick={ e => {
					// Prevent handling clicks if a modifier is in use.
					if ( e.shiftKey || e.metaKey || e.altKey ) {
						return;
					}

					// Prevent default behavior (opening a link).
					e.preventDefault();

					// Select track.
					selectTrack( index );
				} }
				onKeyDown={ e => {
					// Only handle the Space key.
					if ( event.key !== ' ' ) {
						return;
					}

					// Prevent default behavior (scrolling one page down).
					e.preventDefault();

					// Select track.
					selectTrack( index );
				} }
			>
				<span className="jetpack-podcast-player__episode-status-icon" aria-hidden={ ! isActive }>
					{ isActive && renderEpisodeIcon( isPlaying, isError ) }
				</span>
				<span className="jetpack-podcast-player__episode-title">{ track.title }</span>
				{ track.duration && (
					<time className="jetpack-podcast-player__episode-duration">{ track.duration }</time>
				) }
			</a>
			{ isActive && isError && <TrackError link={ track.link } /> }
		</li>
	);
} );

const Playlist = memo( ( { tracks, selectTrack, currentTrack, playerState } ) => {
	return (
		<ol className="jetpack-podcast-player__episodes">
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
					/>
				);
			} ) }
		</ol>
	);
} );

export default Playlist;
