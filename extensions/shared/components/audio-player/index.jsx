/* global _wpmejsSettings, MediaElementPlayer */

/**
 * External dependencies
 */
import { debounce, throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { STATE_PLAYING, STATE_PAUSED, STATE_ERROR } from './constants';

/**
 * Style dependencies
 */
import './style.scss';

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
	const play = () => {
		// Ignoring exceptions as they are handled globally from the audio element.
		audioRef.current.play().catch( () => {} );
	};

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

	// If we get lots of events from clicking on the progress bar in the MediaElement
	// then we can get stuck in a loop. We can so by debouncing here we wait until the
	// next tick before acting on the playStatus prop value changing.
	useEffect(
		debounce( () => {
			// Get the current status of the audio element and the required action to toggle it.
			const [ audioStatus, action ] =
				audioRef.current?.paused === false ? [ STATE_PLAYING, pause ] : [ STATE_PAUSED, play ];
			if ( STATE_ERROR !== playStatus && audioStatus !== playStatus ) {
				action();
			}
		} ),
		[ audioRef, playStatus, trackSource ]
	);

	useEffect( () => {
		if ( ! onTimeChange ) {
			return;
		}
		//Add time change event listener
		const audio = audioRef.current;
		const throttledTimeChange = throttle( time => onTimeChange( time ), 1000 );
		const onTimeUpdate = e => throttledTimeChange( e.target.currentTime );
		onTimeChange && audio?.addEventListener( 'timeupdate', onTimeUpdate );

		return () => {
			audio?.removeEventListener( onTimeUpdate );
		};
	}, [ audioRef, onTimeChange ] );

	//Check current time against prop and potentially jump
	useEffect( () => {
		const audio = audioRef.current;

		// If there's no audio component or we're not controlling time with the `currentTime` prop,
		// then bail early.
		if ( ! currentTime || ! audio ) {
			return;
		}

		// We only want to change the play position if the difference between our current play position
		// and the prop is greater than 2. This is because we throttle the callback to 1 second and there
		// could be a delay of some kind. Two seconds or more is likely because we've been explicitly asked
		// to update the position via the prop.
		if ( Math.abs( Math.floor( currentTime - audio.currentTime ) ) > 2 ) {
			audio.currentTime = currentTime;
		}
	}, [ audioRef, currentTime ] );

	return (
		<div className="jetpack-audio-player">
			{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
			<audio src={ trackSource } ref={ audioRef }></audio>
		</div>
	);
}

export default AudioPlayer;
