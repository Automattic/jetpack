/* global _wpmejsSettings, MediaElementPlayer */
/**
 * External dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */

const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

class AudioPlayer extends Component {
	audioRef = el => {
		if ( el ) {
			// Construct audio element.
			this.audio = document.createElement( 'audio' );
			this.audio.src = this.props.initialTrackSource;
			this.audio.addEventListener( 'play', this.props.handlePlay );
			this.audio.addEventListener( 'pause', this.props.handlePause );
			this.audio.addEventListener( 'error', this.props.handleError );

			// Insert player into the DOM.
			el.appendChild( this.audio );

			// Initialize MediaElement.js
			this.mediaElement = new MediaElementPlayer( this.audio, meJsSettings );
		} else {
			// Cleanup.
			this.mediaElement.remove();
		}
	};

	/**
	 * Play current audio.
	 * @public
	 */
	play = () => {
		// Ignoring exceptions as they are handled globally from the audio element.
		this.audio.play().catch( () => {} );
	};

	/**
	 * Pause current audio.
	 * @public
	 */
	pause = () => {
		this.audio.pause();
	};

	/**
	 * Toggle playing state.
	 * @public
	 */
	togglePlayPause = () => {
		if ( this.audio.paused ) {
			this.play();
		} else {
			this.pause();
		}
	};

	setAudioSource = src => {
		this.audio.src = src;
	};

	render() {
		return <div ref={ this.audioRef } className="jetpack-podcast-player__audio-player"></div>;
	}
}

export default AudioPlayer;
