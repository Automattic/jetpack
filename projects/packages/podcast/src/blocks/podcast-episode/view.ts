/**
 * Front-end view script for the Podcast Episode block.
 *
 * Chapters and soundbites render as real `<button data-start-time="…">`
 * elements so the browser handles keyboard, focus, and a11y natively. We
 * just need one delegated click listener per episode to seek the player.
 */

// Concurrent clicks coalesce into a single pending target so the user lands
// on the last button pressed instead of seeing each intermediate seek flash by.
const pendingSeeks = new WeakMap< HTMLMediaElement, number >();
const awaitingMetadata = new WeakSet< HTMLMediaElement >();

const applyPendingSeek = ( media: HTMLMediaElement ): void => {
	const target = pendingSeeks.get( media );
	if ( typeof target !== 'number' ) {
		return;
	}
	pendingSeeks.delete( media );
	try {
		media.currentTime = target;
	} catch {
		// Setting currentTime may still throw if the media never got past
		// HAVE_NOTHING — ignore and let play() start where it can.
	}
	const playResult = media.play();
	if ( playResult && typeof playResult.catch === 'function' ) {
		playResult.catch( () => {
			// Autoplay restrictions can still reject even after a user click.
		} );
	}
};

const seekAndPlay = ( media: HTMLMediaElement, seconds: number ): void => {
	pendingSeeks.set( media, seconds );

	if ( media.readyState >= 1 ) {
		applyPendingSeek( media );
		return;
	}

	// With preload="none" the element is in readyState 0 (HAVE_NOTHING) until
	// the resource selection algorithm runs. Setting currentTime now would throw
	// INVALID_STATE_ERR per the HTML spec, so wait for loadedmetadata first.
	// A second click while we're already waiting just updates pendingSeeks; the
	// single listener applies the latest target.
	if ( awaitingMetadata.has( media ) ) {
		return;
	}
	awaitingMetadata.add( media );
	media.addEventListener(
		'loadedmetadata',
		() => {
			awaitingMetadata.delete( media );
			applyPendingSeek( media );
		},
		{ once: true }
	);
	media.load();
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
