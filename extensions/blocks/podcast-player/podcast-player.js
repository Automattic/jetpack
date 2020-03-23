/* global _wpmejsSettings, MediaElementPlayer */
/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import { soundIcon, errorIcon } from './icons';

const debug = debugFactory( 'jetpack:podcast-player' );

const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

const STATE_PLAYING = 'is-playing';
const STATE_ERROR = 'is-error';
const STATE_PAUSED = 'is-paused';

const noop = function() {};

/** Class Podcast Player */
class PodcastPlayer {
	playerState = null;
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

		// Store track elements and cast as Array.
		this.trackElements = [ ...block.querySelector( '.podcast-player__episodes' ).children ];

		// Attach event handlers.
		this.block.addEventListener( 'click', this.handleClick.bind( this ), false );
		this.block.addEventListener( 'keydown', this.handleKeyDown.bind( this ), false );
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
		this.audio.addEventListener( 'play', () => this.handlePlay() );
		this.audio.addEventListener( 'pause', () => this.handlePause() );
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
	 * Play handler for audio.
	 * @private
	 */
	handlePlay() {
		this.setPlayerState( STATE_PLAYING );
		if ( this.currentTrack === -1 ) {
			this.currentTrack = 0;
			this.setTrackState( this.currentTrack, true );
		}
	}

	/**
	 * Pause handler for audio.
	 * @private
	 */
	handlePause() {
		// Ignore pauses if we are showing an error.
		if ( this.playerState === STATE_ERROR ) {
			return;
		}

		this.setPlayerState( STATE_PAUSED );
	}

	/**
	 * Play current audio.
	 * @public
	 */
	play() {
		// Ignoring exceptions as they are handled globally from the audio element.
		this.audio.play().catch( noop );
	}

	/**
	 * Pause current audio.
	 * @public
	 */
	pause() {
		this.audio.pause();
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
		this.playerState = state;
		this.block.classList.remove( STATE_ERROR );
		this.block.classList.remove( STATE_PAUSED );
		this.block.classList.remove( STATE_PLAYING );
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

		const iconEl = el.querySelector( '.podcast-player__episode-status-icon' );
		if ( iconEl ) {
			if ( isActive ) {
				if ( isError ) {
					iconEl.innerHTML = errorIcon;
				} else {
					iconEl.innerHTML = soundIcon;
				}
			} else {
				iconEl.innerHTML = '';
			}
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

	/**
	 * Walk the DOM tree up and check whether it is inside
	 * an element representing a track.
	 * @private
	 * @param {Element} el Element to check
	 * @returns {mumber} The track number or -1
	 */
	getTrackFromElement( el ) {
		const track = el.closest( '.podcast-player__episode' );
		return track ? this.trackElements.indexOf( track ) : -1;
	}

	/**
	 * Handle pressing a key.
	 * @private
	 * @param {KeyboardEvent} e The event
	 */
	handleKeyDown( e ) {
		// Only handle the Space key.
		if ( event.key !== ' ' ) {
			return;
		}

		// Check if we are inside a track element and which one.
		const track = this.getTrackFromElement( e.target );
		if ( track === -1 ) {
			return;
		}

		this.selectTrack( track );

		// Prevent default behavior (scrolling one page down).
		e.stopPropagation();
		e.preventDefault();
	}

	/**
	 * Handle a click event.
	 * @private
	 * @param {MouseEvent} e The event
	 */
	handleClick( e ) {
		// Prevent handling clicks if a modifier is in use.
		const isModifierUsed = e.shiftKey || e.metaKey || e.altKey;

		// Check if we are inside an episode link.
		const isOutsideLink = ! e.target.closest( '.podcast-player__episode-link' );

		// Check which track was selected.
		const track = this.getTrackFromElement( e.target );

		// Return if we are not interested in handling this.
		if ( isModifierUsed || isOutsideLink || track === -1 ) {
			return;
		}

		// Prevent default behavior (opening a link).
		e.stopPropagation();
		e.preventDefault();

		// Select the track.
		this.selectTrack( track );
	}
}

export default PodcastPlayer;
