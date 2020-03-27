/**
 * External dependencies
 */
import classnames from 'classnames';
import { memo, useRef, createRef, forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as episodeIcons from '../icons/episode-icons';
import { STATE_ERROR, STATE_PLAYING } from '../constants';

// const trackRefs = [];

const TrackIcon = ( { isPlaying, isError, className } ) => {
	let hiddenText, name;

	if ( isError ) {
		name = 'error';
		hiddenText = __( 'Error' );
	} else if ( isPlaying ) {
		name = 'playing';
		hiddenText = __( 'Playing' );
	}

	const icon = episodeIcons[ name ];

	if ( ! icon ) {
		// Return empty element - we need it for layout purposes.
		return <span className={ className } />;
	}

	return (
		<span className={ `${ className } ${ className }--${ name }` }>
			<span className="jetpack-podcast-player--visually-hidden">{ hiddenText }</span>
			{ icon }
		</span>
	);
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

const focusTrack = ( trackRefs, focusIndex ) => {
	if ( focusIndex < 0 ) {
		// focus the last track
		focusIndex = trackRefs.length - 1;
	} else if ( focusIndex > trackRefs.length - 1 ) {
		// focus the first item
		focusIndex = 0;
	}

	trackRefs[ focusIndex ].current.focus();
};

const Track = memo( ( { track, trackRefs, isActive, isPlaying, isError, selectTrack, index } ) => {
	return (
		<li
			className={ classnames( 'jetpack-podcast-player__episode', {
				'is-active': isActive,
			} ) }
		>
			<a
				ref={ trackRefs[ index ] }
				className="jetpack-podcast-player__episode-link"
				href={ track.link }
				role="menuitemradio"
				aria-checked={ isActive }
				tabIndex={ isActive ? '0' : '-1' }
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
					// spacebar
					if ( e.keyCode === 32 ) {
						e.preventDefault();
						selectTrack( index );
						e.currentTarget.focus();
					}
					// arrow down / arrow right
					else if ( e.keyCode === 40 || e.keycode === 39 ) {
						e.preventDefault();
						// send focus to the next item (or the first if none left)
						focusTrack( trackRefs, index + 1 );
					}

					// arrow up / arrow left
					else if ( e.keyCode === 38 || e.keycode === 37 ) {
						e.preventDefault();
						// send focus to the previous item (or the last if none left)
						focusTrack( trackRefs, index - 1 );
					}
				} }
			>
				<TrackIcon
					className="jetpack-podcast-player__episode-status-icon"
					isPlaying={ isPlaying }
					isError={ isError }
				/>
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
	const trackRefs = [];
	return (
		<ol className="jetpack-podcast-player__episodes" role="menu">
			{ tracks.map( ( track, index ) => {
				const isActive = currentTrack === index;
				const trackRef = useRef( null );
				trackRefs[ index ] = trackRef;
				return (
					<Track
						key={ track.id }
						index={ index }
						track={ track }
						trackRefs={ trackRefs }
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
