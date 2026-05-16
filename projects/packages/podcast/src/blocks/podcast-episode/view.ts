/**
 * Front-end view script for the Podcast Episode block.
 *
 * Chapters and soundbites render as real `<button data-start-time="…">`
 * elements so the browser handles keyboard, focus, and a11y natively. We
 * just need one delegated click listener per episode to seek the player.
 */

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
		try {
			media.currentTime = seconds;
		} catch {
			// Some browsers throw if the media isn't ready yet — ignore and let
			// play() resume from wherever the element starts.
		}
		const playResult = media.play();
		if ( playResult && typeof playResult.catch === 'function' ) {
			playResult.catch( () => {
				// Autoplay restrictions can still reject even after a user click.
			} );
		}
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
