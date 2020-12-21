/* global _wpmejsSettings, MediaElementPlayer */

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import {
	STATE_PLAYING,
	STATE_PAUSED,
	STATE_ERROR,
	STATE_PLAYING_IN_POSITION,
} from './constants';

/**
 * Style dependencies
 */
import './style.scss';
import { useCallback } from 'react';

const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

function createJumpButton( containerClass, label, clickHandler ) {
	const buttonContainer = document.createElement( 'div' );
	buttonContainer.className = containerClass;

	const button = document.createElement( 'button' );
	button.innerText = label;
	button.addEventListener( 'click', clickHandler );
	button.setAttribute( 'aria-label', label );
	button.setAttribute( 'title', label );
	buttonContainer.appendChild( button );
	return buttonContainer;
}

function AudioPlayer( {
	trackSource,
	onPlay,
	onPause,
	onError,
	onTimeChange,
	onSkipForward,
	onJumpBack,
	currentTime,
	playStatus = STATE_PAUSED,
} ) {
	const audioRef = useRef();

	/**
	 * Play current audio.
	 *
	 * @public
	 */
	const play = useCallback( () => {
		if ( currentTime !== false && playStatus === STATE_PLAYING_IN_POSITION ) {
			audioRef.current.currentTime = currentTime;
		}

		// Ignoring exceptions as they are handled globally from the audio element.
		audioRef.current.play().catch( () => {} );
	}, [ currentTime, playStatus ] );

	/**
	 * Pause current audio.
	 *
	 * @public
	 */
	const pause = () => {
		audioRef.current.pause();
		speak( __( 'Paused', 'jetpack' ), 'assertive' );
	};

	useEffect( () => {
		const audio = audioRef.current;
		// Initialize MediaElement.js.
		const mediaElement = new MediaElementPlayer( audio, meJsSettings );

		// Add the skip and jump buttons if needed
		if ( onJumpBack || onSkipForward ) {
			const containerClass = `${ mediaElement.options.classPrefix }button ${ mediaElement.options.classPrefix }jump-button`;

			if ( onJumpBack ) {
				const buttonClass = `${ containerClass } ${ mediaElement.options.classPrefix }jump-backward-button`;
				mediaElement.addControlElement(
					createJumpButton( buttonClass, 'Jump Back', onJumpBack ),
					'jumpBackwardButton'
				);
			}

			if ( onSkipForward ) {
				const buttonClass = `${ containerClass } ${ mediaElement.options.classPrefix }skip-forward-button`;
				mediaElement.addControlElement(
					createJumpButton( buttonClass, 'Skip Forward', onSkipForward ),
					'skipForwardButton'
				);
			}
		}
		onPlay && audio.addEventListener( 'play', onPlay );
		onPause && audio.addEventListener( 'pause', onPause );
		onError && audio.addEventListener( 'error', onError );

		return () => {
			// Cleanup.
			mediaElement.remove();
			onPlay && audio.removeEventListener( 'play', onPlay );
			onPause && audio.removeEventListener( 'pause', onPause );
			onError && audio.removeEventListener( 'error', onError );
		};
	}, [ audioRef, onPlay, onPause, onError, onJumpBack, onSkipForward ] );

	useEffect( () => {
		// Get the current status of the audio element and the required action to toggle it.
		const [ audioStatus, action ] =
			audioRef.current?.paused === false ? [ STATE_PLAYING, pause ] : [ STATE_PAUSED, play ];

		if ( STATE_ERROR !== playStatus && audioStatus !== playStatus ) {
			action();
		}
	}, [ audioRef, play, playStatus ] );

	//Check current time against prop and potentially jump
	useEffect( () => {
		const audio = audioRef.current;
		if ( ! currentTime || ! audio ) {
			return;
		}

		audio.currentTime = currentTime;
	}, [ audioRef, currentTime ] );

	return (
		<div className="jetpack-audio-player">
			{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
			<audio src={ trackSource } ref={ audioRef }></audio>
		</div>
	);
}

export default AudioPlayer;
