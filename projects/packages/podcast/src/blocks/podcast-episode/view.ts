/**
 * Front-end view script for the Podcast Episode block.
 *
 * Wires chapter and soundbite list items so a click (or Enter/Space) seeks the
 * associated audio/video element to that timestamp and starts playback. Items
 * carry the timestamp on `data-start-time` (seconds, integer) — emitted by the
 * server-side render callback.
 */

const seekToTime = ( media: HTMLMediaElement, seconds: number ): void => {
	if ( Number.isNaN( seconds ) || seconds < 0 ) {
		return;
	}
	try {
		media.currentTime = seconds;
	} catch {
		// Some browsers throw if the media isn't ready yet — ignore and let
		// the play() below resume from wherever the element starts.
	}
	const playResult = media.play();
	if ( playResult && typeof playResult.catch === 'function' ) {
		playResult.catch( () => {
			// Autoplay can fail without a user gesture; the click satisfies that,
			// but mute restrictions or denied media permissions can still reject.
		} );
	}
};

const wireEpisode = ( root: Element ): void => {
	const media = root.querySelector< HTMLMediaElement >(
		'.jetpack-podcast-episode__audio, .jetpack-podcast-episode__video'
	);
	if ( ! media ) {
		return;
	}

	const cues = root.querySelectorAll< HTMLElement >( '[data-start-time]' );
	cues.forEach( cue => {
		const start = Number( cue.dataset.startTime );
		if ( Number.isNaN( start ) ) {
			return;
		}
		cue.setAttribute( 'role', 'button' );
		cue.setAttribute( 'tabindex', '0' );
		cue.classList.add( 'is-clickable' );
		cue.addEventListener( 'click', () => seekToTime( media, start ) );
		cue.addEventListener( 'keydown', event => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				seekToTime( media, start );
			}
		} );
	} );
};

const init = (): void => {
	document
		.querySelectorAll< HTMLElement >( '.wp-block-jetpack-podcast-episode' )
		.forEach( wireEpisode );
};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
