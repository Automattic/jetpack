/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as trackIcons from '../icons/track-icons';
import { STATE_ERROR, STATE_PLAYING } from '../constants';

const TrackIcon = ( { isPlaying, isError, className } ) => {
	let hiddenText, name;

	if ( isError ) {
		name = 'error';
		/* translators: This is text to describe the current state. This will go before the track title, such as "Error: [The title of the track]" */
		hiddenText = __( 'Error:', 'jetpack' );
	} else if ( isPlaying ) {
		name = 'playing';
		/* translators: Text to describe the current state. This will go before the track title, such as "Playing: [The title of the track]" */
		hiddenText = __( 'Playing:', 'jetpack' );
	}

	const icon = trackIcons[ name ];

	if ( ! icon ) {
		// Return empty element - we need it for layout purposes.
		return <span className={ className } />;
	}

	return (
		<span className={ `${ className } ${ className }--${ name }` }>
			{ /* Intentional space left after hiddenText */ }
			<span className="jetpack-podcast-player--visually-hidden">{ `${ hiddenText } ` }</span>
			{ icon }
		</span>
	);
};

import { getColorClassName } from '../utils';

const TrackError = memo( ( { link, title } ) => (
	<div className="jetpack-podcast-player__track-error">
		{ __( 'Episode unavailable. ', 'jetpack' ) }
		{ link && (
			<span>
				<a href={ link } rel="noopener noreferrer nofollow" target="_blank">
					<span class="jetpack-podcast-player--visually-hidden">
						{ /* Intentional trailing space outside of the translated string */ }
						{ /* translators: %s is the title of the track. This text is visually hidden from the screen, but available to screen readers */ }
						{ `${ sprintf( __( '%s:', 'jetpack' ), title ) } ` }
					</span>
					{ __( 'Open in a new tab', 'jetpack' ) }
				</a>
			</span>
		) }
	</div>
) );

const Track = memo(
	( {
		track,
		isActive,
		isPlaying,
		isError,
		selectTrack,
		index,
		colors = {
			primary: {},
			secondary: {},
		},
	} ) => {
		// Set CSS classes string.
		const primaryColorClass = getColorClassName( 'color', colors.primary.name );
		const secondaryColorClass = getColorClassName( 'color', colors.secondary.name );
		const trackClassName = classnames( 'jetpack-podcast-player__track', {
			'is-active': isActive,
			'has-primary': isActive && ( colors.primary.name || colors.primary.custom ),
			[ primaryColorClass ]: isActive && !! primaryColorClass,
			'has-secondary': ! isActive && ( colors.secondary.name || colors.secondary.custom ),
			[ secondaryColorClass ]: ! isActive && !! secondaryColorClass,
		} );

		const inlineStyle = {};
		if ( isActive && colors.primary.custom && ! primaryColorClass ) {
			inlineStyle.color = colors.primary.custom;
		} else if ( ! isActive && colors.secondary.custom && ! secondaryColorClass ) {
			inlineStyle.color = colors.secondary.custom;
		}

		/* translators: This needs to be a single word with no spaces. It describes the current item in the group. A screen reader will announce it as "[title], current track" */
		const ariaCurrent = isActive ? __( 'track', 'jetpack' ) : undefined;

		return (
			<li
				className={ trackClassName }
				style={ Object.keys( inlineStyle ).length ? inlineStyle : null }
			>
				<a
					className="jetpack-podcast-player__track-link"
					href={ track.link }
					role="button"
					aria-current={ ariaCurrent }
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
					<TrackIcon
						className="jetpack-podcast-player__track-status-icon"
						isPlaying={ isPlaying }
						isError={ isError }
					/>
					<span className="jetpack-podcast-player__track-title">{ track.title }</span>
					{ track.duration && (
						<time className="jetpack-podcast-player__track-duration" dateTime={ track.duration }>
							{ track.duration }
						</time>
					) }
				</a>
				{ isActive && isError && <TrackError link={ track.link } title={ track.title } /> }
			</li>
		);
	}
);

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
