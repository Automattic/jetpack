/* global _wpmejsSettings, MediaElementPlayer */

/**
 * External dependencies
 */
import { debounce } from 'lodash';

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
	reportedTime,
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
					createJumpButton( buttonClass, __( 'Jump Back', 'jetpack' ), onJumpBack ),
					'jumpBackwardButton'
				);
			}

			if ( onSkipForward ) {
				const buttonClass = `${ containerClass } ${ mediaElement.options.classPrefix }skip-forward-button`;
				mediaElement.addControlElement(
					createJumpButton( buttonClass, __( 'Skip Forward', 'jetpack' ), onSkipForward ),
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
	useEffect( () => {
		// Get the current status of the audio element and the required action to toggle it.
		const [ audioStatus, action ] =
			audioRef.current?.paused === false ? [ STATE_PLAYING, pause ] : [ STATE_PAUSED, play ];
		const debouncedAction = debounce( action, 100 );
		if ( STATE_ERROR !== playStatus && audioStatus !== playStatus ) {
			debouncedAction();
		}
		return () => {
			debouncedAction.cancel();
		};
	}, [ audioRef, playStatus, trackSource ] );

	useEffect( () => {
		if ( ! onTimeChange ) {
			return;
		}
		//Add time change event listener
		const audio = audioRef.current;
		const onTimeUpdate = e => onTimeChange( e.target.currentTime );
		onTimeChange && audio?.addEventListener( 'timeupdate', onTimeUpdate );

		return () => {
			audio?.removeEventListener( 'timeupdate', onTimeUpdate );
		};
	}, [ audioRef, onTimeChange ] );

	// Handle `currentTime` property, based on `reportedTime` property.
	// It will change the player time declaratively.
	useEffect( () => {
		// If there's no audio component,
		// or we're not controlling time with the `currentTime` and `reportedTime` prop,
		// then bail early.
		const audio = audioRef.current;
		if (
			! audio ||
			typeof currentTime === 'undefined' ||
			typeof reportedTime === 'undefined'
		) {
			return;
		}

		// If there is not differece between `currentTime`
		// and `reportedTime`,
		// then bail early.
		if ( currentTime === reportedTime ) {
			return;
		}

		audio.currentTime = currentTime;
	}, [ audioRef, currentTime, reportedTime ] );
	return (
		<div className="jetpack-audio-player">
			{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
			<audio src={ trackSource } ref={ audioRef }></audio>
		</div>
	);
}

export default AudioPlayer;
