/**
 * Front-end view script for the Podcast Episode block.
 *
 * Chapters and soundbites render as real `<button data-start-time="…">`
 * elements so the browser handles keyboard, focus, and a11y natively. We
 * just need one delegated click listener per episode to seek the player.
 */

const seekAndPlay = ( media: HTMLMediaElement, seconds: number ): void => {
	const seek = () => {
		try {
			media.currentTime = seconds;
		} catch {
			// Edge case: setting currentTime may still throw if the media never
			// got past HAVE_NOTHING — ignore and let play() start where it can.
		}
	};

	// With preload="none" the element is in readyState 0 (HAVE_NOTHING) until
	// play() is called. Setting currentTime now would throw INVALID_STATE_ERR
	// per the HTML spec, so wait for loadedmetadata if we're not there yet.
	if ( media.readyState >= 1 ) {
		seek();
	} else {
		media.addEventListener( 'loadedmetadata', seek, { once: true } );
		media.load();
	}

	const playResult = media.play();
	if ( playResult && typeof playResult.catch === 'function' ) {
		playResult.catch( () => {
			// Autoplay restrictions can still reject even after a user click.
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

	root.addEventListener( 'click', event => {
		const button = ( event.target as Element | null )?.closest< HTMLButtonElement >(
			'button[data-start-time]'
		);
		if ( ! button ) {
			return;
		}
		const seconds = Number( button.dataset.startTime );
		if ( Number.isNaN( seconds ) || seconds < 0 ) {
			return;
		}
		seekAndPlay( media, seconds );
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
