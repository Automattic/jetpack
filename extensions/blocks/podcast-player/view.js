/* global jetpackPodcastPlayers */
/**
 * Internal dependencies
 */
import './style.scss';
import './closest-shim';
import PodcastPlayer from './podcast-player';

const playerInstances = {};

const initializeBlock = function( id ) {
	// Create player instance.
	const player = new PodcastPlayer( id );

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
	playerInstances,
};
