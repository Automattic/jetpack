/**
 * Internal dependencies
 */
import './style.scss';

window.addEventListener( 'click', function( e ) {
	// Prevent handling clicks if a modifier is in use.
	if ( e.shiftKey || e.metaKey || e.altKey ) {
		return;
	}

	// Check if the clicked element was episode link.
	const audioUrl = e.target.getAttribute( 'data-podcast-audio' );
	if ( audioUrl ) {
		const block = e.target.closest( '.wp-block-jetpack-podcast-player' );
		const audioPlayer = block && block.querySelector( 'audio' );
		if ( audioPlayer ) {
			audioPlayer.src = audioUrl;
			audioPlayer.play();
			e.preventDefault();
		}
	}
} );
