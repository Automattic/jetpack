/* global _wpmejsSettings, MediaElementPlayer, jetpackPodcastPlayers */
/**
 * Internal dependencies
 */
import './style.scss';

const playerInstances = {};
const meJsSettings = typeof _wpmejsSettings !== undefined ? _wpmejsSettings : {};

const initializeBlock = function( id ) {
	const block = document.getElementById( id );
	if ( block ) {
		const player = {
			id,
			block,
			audio: block.querySelector( 'audio' ),
			currentTrack: 0,
		};
		playerInstances[ id ] = player;

		// Initialize player UI.
		player.mediaElement = new MediaElementPlayer( player.audio, meJsSettings );
	}
};

// Initialze queued players.
if ( window.jetpackPodcastPlayers !== undefined ) {
	jetpackPodcastPlayers.forEach( initializeBlock );
}

// Replace the queue with an immediate initialization for async loaded players.
window.jetpackPodcastPlayers = {
	push: initializeBlock,
};

// Add global handler for clicks.
window.addEventListener( 'click', function( e ) {
	// Prevent handling clicks if a modifier is in use.
	if ( e.shiftKey || e.metaKey || e.altKey ) {
		return;
	}

	// Check if the clicked element was episode link.
	const audioUrl = e.target.getAttribute( 'data-podcast-audio' );
	if ( audioUrl ) {
		const block = e.target.closest( '.wp-block-jetpack-podcast-player' );
		const player = playerInstances[ block.id ];
		if ( player ) {
			player.audio.pause();
			player.audio.src = audioUrl;
			player.audio.play();
			e.preventDefault();
		}
	}
} );
