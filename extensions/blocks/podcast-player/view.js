/* global _wpmejsSettings, MediaElementPlayer, jetpackPodcastPlayers */
/**
 * Internal dependencies
 */
import './style.scss';

const playerInstances = {};
const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

const initializeBlock = function( id ) {
	const block = document.getElementById( id );

	// Check if we can find the block and required dependency.
	if ( ! block || ! MediaElementPlayer ) {
		return;
	}

	// Create player instance.
	const player = {
		id,
		block,
		currentTrack: 0,
	};

	// Initialize player UI.
	player.audio = document.createElement( 'audio' );
	player.audio.src = block
		.querySelector( '[data-jetpack-podcast-audio]' )
		.getAttribute( 'data-jetpack-podcast-audio' );
	block.insertBefore( player.audio, block.firstChild );
	player.mediaElement = new MediaElementPlayer( player.audio, meJsSettings );

	// Save instance to the list of active ones.
	playerInstances[ id ] = player;
};

// Initialize queued players.
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
	const audioUrl = e.target.getAttribute( 'data-jetpack-podcast-audio' );
	if ( audioUrl ) {
		const block = e.target.closest( '.wp-block-jetpack-podcast-player' );
		const player = block && block.id && playerInstances[ block.id ];
		if ( player ) {
			player.audio.pause();
			player.audio.src = audioUrl;
			player.audio.play();
			e.preventDefault();
		}
	}
} );
