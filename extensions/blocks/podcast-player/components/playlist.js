/**
 * External dependencies
 */
import classnames from 'classnames';
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STATE_ERROR } from '../constants';

const TrackError = memo( ( { link } ) => (
	<div className="podcast-player__episode-error">
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

const Track = memo( ( { track, isActive, isError, selectTrack, index } ) => {
	return (
		<li
			className={ classnames( 'podcast-player__episode', {
				'is-active': isActive,
			} ) }
		>
			<a
				className="podcast-player__episode-link"
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
				<span className="podcast-player__episode-status-icon"></span>
				<span className="podcast-player__episode-title">{ track.title }</span>
				{ track.duration && (
					<time className="podcast-player__episode-duration">{ track.duration }</time>
				) }
			</a>
			{ isActive && isError && <TrackError link={ track.link } /> }
		</li>
	);
} );

const Playlist = memo( ( { tracks, selectTrack, currentTrack, playerState } ) => {
	return (
		<ol className="podcast-player__episodes">
			{ tracks.map( ( track, index ) => (
				<Track
					key={ track.id }
					index={ index }
					track={ track }
					selectTrack={ selectTrack }
					isActive={ currentTrack === index }
					isError={ currentTrack === index && playerState === STATE_ERROR }
				/>
			) ) }
		</ol>
	);
} );

export default Playlist;
