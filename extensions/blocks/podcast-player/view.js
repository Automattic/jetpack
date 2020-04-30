/* global jetpackPodcastPlayers */

/**
 * External dependencies
 */
import debugFactory from 'debug';

/**
 * WordPress dependencies
 */
import { render, createElement, unmountComponentAtNode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PodcastPlayer from './components/podcast-player';

import './style.scss';

const debug = debugFactory( 'jetpack:podcast-player' );
const playerInstances = {};

/**
 * Downgrades the block to use the static markup as rendered on the server.
 *
 * @param {Element} block - The root element of the block.
 */
const downgradeBlockToStatic = function( block ) {
	block.classList.add( 'is-default' );
};

/**
 * Initialize player instance.
 *
 * @param {string} id - The id of the block element in document.
 */
const initializeBlock = function( id ) {
	// Find DOM node.
	const block = document.getElementById( id );
	debug( 'initializing', id, block );

	// Check if we can find the block.
	if ( ! block ) {
		return;
	}

	// Load data from the embedded JSON and remove it from the HTML.
	const dataContainer = block.querySelector( 'script[type="application/json"]' );
	if ( ! dataContainer ) {
		downgradeBlockToStatic( block );
		return;
	}
	let data;
	try {
		data = JSON.parse( dataContainer.text );
	} catch ( e ) {
		debug( 'error parsing json', e );
		downgradeBlockToStatic( block );
		return;
	}
	dataContainer.remove();

	// Save the static markup.
	const fallbackHTML = block.innerHTML;

	// Abort if not tracks found.
	if ( ! data || ! data.tracks.length ) {
		debug( 'no tracks found' );
		downgradeBlockToStatic( block );
		return;
	}

	try {
		// Prepare component.
		const component = createElement( PodcastPlayer, {
			...data,
			onError: function() {
				// Unmount React version and bring back the static HTML.
				unmountComponentAtNode( block );
				block.innerHTML = fallbackHTML;
				downgradeBlockToStatic( block );
			},
		} );

		// Render and save instance to the list of active ones.
		playerInstances[ id ] = render( component, block );
	} catch ( err ) {
		debug( 'unable to render', err );
		downgradeBlockToStatic( block );
	}
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
