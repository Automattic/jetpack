/* global _wpmejsSettings, MediaElementPlayer */

/**
 * External dependencies
 */

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

const meJsSettings = typeof _wpmejsSettings !== 'undefined' ? _wpmejsSettings : {};

function AudioPlayer( {
	trackSource,
	handlePlay,
	handlePause,
	handleError,
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
		handlePlay && audio.addEventListener( 'play', handlePlay );
		handlePause && audio.addEventListener( 'pause', handlePause );
		handleError && audio.addEventListener( 'error', handleError );

		return () => {
			// Cleanup.
			mediaElement.remove();
			handlePlay && audio.removeEventListener( 'play', handlePlay );
			handlePause && audio.removeEventListener( 'pause', handlePause );
			handleError && audio.removeEventListener( 'error', handleError );
		};
	}, [ audioRef, handlePlay, handlePause, handleError ] );

	useEffect( () => {
		const [ audioStatus, action ] =
			audioRef.current?.paused === false ? [ STATE_PLAYING, pause ] : [ STATE_PAUSED, play ];
		if ( STATE_ERROR !== playStatus && audioStatus !== playStatus ) {
			action();
		}
	}, [ audioRef, playStatus, trackSource ] );

	return (
		<div className="jetpack-podcast-player__audio-player">
			{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
			<audio src={ trackSource } ref={ audioRef }></audio>
		</div>
	);
}

export default AudioPlayer;
