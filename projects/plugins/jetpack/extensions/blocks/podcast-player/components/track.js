import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { getColorClassName } from '../utils';
import TrackError from './track-error';
import TrackIcon from './track-icon';

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
		const trackClassName = clsx( 'jetpack-podcast-player__track', {
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

		const /* translators: This needs to be a single word with no spaces. It describes
			   the current item in the group. A screen reader will announce it as "[title],
			   current track". */
			ariaCurrent = isActive ? __( 'track', 'jetpack' ) : undefined;

		return (
			<li
				className={ trackClassName }
				style={ Object.keys( inlineStyle ).length ? inlineStyle : null }
			>
				<a
					className="jetpack-podcast-player__link jetpack-podcast-player__track-link"
					href={ track.link || track.src }
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
				{ isActive && isError && (
					<TrackError link={ track.link } title={ track.title } colors={ colors } />
				) }
			</li>
		);
	}
);

export default Track;
