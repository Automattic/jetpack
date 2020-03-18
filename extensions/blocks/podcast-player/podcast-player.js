/* global _wpmejsSettings, MediaElementPlayer */
/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack:podcast-player' );

const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

const STATE_PLAYING = 'is-playing';
const STATE_ERROR = 'is-error';
const STATE_PAUSED = 'is-paused';

/** Class Podcast Player */
class PodcastPlayer {
	id = null;
	block = null;
	currentTrack = -1;
	tracks = [];
	attributes = {};
	audio = null;
	mediaElement = null;
	trackElements = [];

	/**
	 * Create player instance.
	 * @param {string} id The id of the block element in document.
	 */
	constructor( id ) {
		// Find DOM node.
		const block = document.getElementById( id );
		debug( 'constructing', id, block );

		// Check if we can find the block and required dependency.
		if ( ! block || ! MediaElementPlayer ) {
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

		// Initialize player UI.
		this.initializeAudio();

		// Store track elements.
		this.trackElements = block.querySelector( '.podcast-player__episodes' ).children;
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

	/**
	 * Initialize audio player instance.
	 * @private
	 */
	initializeAudio() {
		// Construct audio element.
		this.audio = document.createElement( 'audio' );
		this.audio.src = this.getTrack( 0 ).src;
		this.audio.addEventListener( 'play', () => this.setPlayerState( STATE_PLAYING ) );
		this.audio.addEventListener( 'pause', () => this.setPlayerState( STATE_PAUSED ) );
		this.audio.addEventListener( 'error', () => this.handleError() );

		// Insert player into the DOM.
		this.block.insertBefore( this.audio, this.block.firstChild );

		// Initialize MediaElement.js
		this.mediaElement = new MediaElementPlayer( this.audio, meJsSettings );
	}

	/**
	 * Get track data.
	 * @private
	 * @param {number} track The track number
	 * @returns {object} Track object.
	 */
	getTrack( track ) {
		return this.tracks[ track ];
	}

	/**
	 * Error handler for audio.
	 * @private
	 */
	handleError() {
		this.setPlayerState( STATE_ERROR );
		if ( this.currentTrack > -1 ) {
			this.setTrackState( this.currentTrack, true, true );
		}
	}

	/**
	 * Play current audio.
	 * @public
	 */
	play() {
		this.audio.play();
		// TODO: UI state
	}

	/**
	 * Pause current audio.
	 * @public
	 */
	pause() {
		this.audio.pause();
		// TODO: UI state
	}

	/**
	 * Stop current audio, clean selected track.
	 * @public
	 */
	stop() {
		this.pause();
		this.setTrackState( this.currentTrack, false );
		this.currentTrack = -1;
	}

	/**
	 * Toggle playing state.
	 * @public
	 */
	togglePlayPause() {
		if ( this.audio.paused ) {
			this.play();
		} else {
			this.pause();
		}
	}

	/**
	 * Select a track and play/pause, as needed.
	 * @public
	 * @param {number} track The track number
	 */
	selectTrack( track ) {
		// Current track already selected.
		if ( this.currentTrack === track ) {
			this.togglePlayPause();
			return;
		}

		// Something else is playing.
		if ( this.currentTrack !== -1 ) {
			this.stop();
		}

		// Load a new track.
		this.loadAndPlay( track );
	}

	/**
	 * Set a player state classname.
	 * @private
	 * @param {string} state Player state.
	 */
	setPlayerState( state ) {
		this.block.classList.remove( STATE_ERROR, STATE_PAUSED, STATE_PLAYING );
		this.block.classList.add( state );
	}

	/**
	 * Load audio from the track, start playing.
	 * @private
	 * @param {number} track The track number
	 */
	loadAndPlay( track ) {
		const trackData = this.getTrack( track );
		if ( ! trackData ) {
			return;
		}
		this.audio.src = trackData.src;
		this.currentTrack = track;
		this.play();
		this.setTrackState( track, true );
	}

	/**
	 * Visually mark track active or inactive.
	 * @private
	 * @param {number} track The track number
	 * @param {boolean} isActive True if track is active
	 * @param {boolean} isError True if track couldn't be played
	 */
	setTrackState( track, isActive, isError = false ) {
		// Mark track element as active/inactive.
		const el = this.trackElements[ track ];

		// Active state classname.
		if ( isActive ) {
			el.classList.add( 'is-active' );
		} else {
			el.classList.remove( 'is-active' );
		}

		// Maintain pressed state.
		el.querySelector( '[aria-pressed]' ).setAttribute( 'aria-pressed', JSON.stringify( isActive ) );

		// Add or remove error.
		const errorEl = el.querySelector( '.podcast-player__episode-error' );
		if ( isError && ! errorEl ) {
			const trackData = this.getTrack( track );
			el.appendChild( this.renderErrorWithLink( trackData && trackData.link ) );
		} else if ( ! isError && errorEl ) {
			errorEl.remove();
		}
	}

	/**
	 * Construct error markup.
	 * @private
	 * @param {string} link Optional URL to use as a fallback link
	 * @returns {Element} Error DOM Element
	 */
	renderErrorWithLink( link ) {
		const errorEl = document.createElement( 'div' );
		errorEl.classList.add( 'podcast-player__episode-error' );
		errorEl.appendChild( new Text( __( 'Episode unavailable', 'jetpack' ) ) );

		if ( link ) {
			const linkEl = document.createElement( 'a' );
			linkEl.rel = 'noopener noreferrer nofollow';
			linkEl.target = '_blank';
			linkEl.href = link;
			linkEl.innerText = __( 'Open in a new tab', 'jetpack' );

			const spanEl = document.createElement( 'span' );
			spanEl.appendChild( new Text( ' (' ) );
			spanEl.appendChild( linkEl );
			spanEl.appendChild( new Text( ')' ) );
			errorEl.appendChild( spanEl );
		}

		return errorEl;
	}
}

export default PodcastPlayer;
