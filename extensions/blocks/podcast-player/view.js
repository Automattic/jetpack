/* global jetpackPodcastPlayers */
/**
 * External dependencies
 */
import debugFactory from 'debug';
import { render, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import PodcastPlayer from './components/podcast-player';

const debug = debugFactory( 'jetpack:podcast-player' );
const playerInstances = {};

/**
 * Initialize player instance.
 * @param {string} id The id of the block element in document.
 */
const initializeBlock = function( id ) {
	// Find DOM node.
	const block = document.getElementById( id );
	debug( 'constructing', id, block );

	// Check if we can find the block.
	if ( ! block ) {
		return;
	}

	// Load data from the embedded JSON.
	const dataContainer = block.querySelector( 'script[type="application/json"]' );
	if ( ! dataContainer ) {
		return;
	}
	let data;
	try {
		data = JSON.parse( dataContainer.text );
	} catch ( e ) {
		debug( 'error parsing json', e );
		return;
	}

	// Abort if not tracks found.
	if ( ! data || ! data.tracks.length ) {
		return;
	}

	// Prepare component.
	const component = createElement( PodcastPlayer, {
		...data,
	} );

	// Prepare mount point.
	const div = document.createElement( 'div' );
	block.appendChild( div );

	// Render and save instance to the list of active ones.
	playerInstances[ id ] = render( component, div );
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
