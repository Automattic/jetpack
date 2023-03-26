const jpgtModalContainer = document.getElementById( 'jpgt-modal-container' );
const jpgtModal = document.getElementById( 'jpgt-modal' );
const jpVideo = document.getElementById( 'jpgt-video' );

/**
 * Plays the animation!
 */
function jpgtPlayVideo() {
	const url = new URL( window.location.href );
	url.searchParams.set( 'jetpack-golden-token', 'redeemed' );
	window.history.replaceState( null, null, url );
	jpgtModal.classList.add( 'animating' );
	jpVideo.play();
}

/**
 * Resets the animation.
 */
function jpgtReset() {
	jpgtModal.classList.remove( 'animating' );
}

/**
 * Closes the modal.
 */
function jpgtCloseModal() {
	jpgtModalContainer.classList.add( 'jpgt-hidden' );
	jpgtModal.classList.add( 'jpgt-hidden' );
}

document.addEventListener(
	'keydown',
	event => {
		const code = event.code;
		if ( code === 'KeyR' ) {
			jpgtReset();
		}
		if ( code === 'Escape' ) {
			jpgtCloseModal();
		}
	},
	false
);
