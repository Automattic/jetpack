/**
 * Internal dependencies
 */
import debugFactory from 'debug';
import { render, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */

import JetpackPodcastPlayer from './components/podcast-player';

const debug = debugFactory( 'jetpack:podcast-player' );

/** Class Podcast Player */
class PodcastPlayer {
	id = null;
	block = null;
	tracks = [];
	attributes = {};

	/**
	 * Create player instance.
	 * @param {string} id The id of the block element in document.
	 */
	constructor( id ) {
		// Find DOM node.
		const block = document.getElementById( id );
		debug( 'constructing', id, block );

		// Check if we can find the block.
		if ( ! block ) {
			return;
		}

		// Create player instance.
		this.id = id;
		this.block = block;

		// Load data from the embedded JSON.
		this.loadMetadata();
		if ( ! this.tracks.length ) {
			return;
		}

		const component = createElement( JetpackPodcastPlayer, {
			tracks: this.tracks,
			attributes: this.attributes,
		} );
		const div = document.createElement( 'div' );
		this.block.appendChild( div );
		render( component, div );
	}

	/**
	 * Lookup JSON data in block and load them into this intance.
	 * @private
	 */
	loadMetadata() {
		const dataContainer = this.block.querySelector( 'script[type="application/json"]' );
		if ( dataContainer ) {
			try {
				const data = JSON.parse( dataContainer.text );
				this.tracks = data.tracks;
				this.attributes = data.attributes;
			} catch ( e ) {
				return;
			}
		}
	}
}

export default PodcastPlayer;
