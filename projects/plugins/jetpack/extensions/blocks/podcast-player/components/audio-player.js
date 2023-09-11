/* global _wpmejsSettings, MediaElementPlayer */

import { speak } from '@wordpress/a11y';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

class AudioPlayer extends Component {
	audioRef = el => {
		if ( el ) {
			// Construct audio element.
			const audio = document.createElement( 'audio' );
			audio.src = this.props.initialTrackSource;

			// Insert player into the DOM.
			el.appendChild( audio );

			// Initialize MediaElement.js.
			this.mediaElement = new MediaElementPlayer( audio, meJsSettings );

			// Save audio reference from the MediaElement.js instance.
			this.audio = this.mediaElement.domNode;
			this.audio.addEventListener( 'play', this.props.handlePlay );
			this.audio.addEventListener( 'pause', this.props.handlePause );
			this.audio.addEventListener( 'error', this.props.handleError );
		} else {
			// Cleanup.
			this.mediaElement.remove();
		}
	};

	/**
	 * Play current audio.
	 *
	 * @public
	 */
	play = () => {
		// Ignoring exceptions as they are handled globally from the audio element.
		this.audio.play().catch( () => {} );
	};

	/**
	 * Pause current audio.
	 *
	 * @public
	 */
	pause = () => {
		this.audio.pause();
		speak( __( 'Paused', 'jetpack' ), 'assertive' );
	};

	/**
	 * Toggle playing state.
	 *
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
