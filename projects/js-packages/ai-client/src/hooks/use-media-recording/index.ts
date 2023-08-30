/**
 * External dependencies
 */
import { useRef, useState, useEffect, useCallback } from '@wordpress/element';

/*
 * Types
 */
type RecordingStateProp = 'inactive' | 'recording' | 'paused';
type UseMediaRecordingReturn = {
	/**
	 * `start` recording handler
	 */
	start: () => void;

	/**
	 * `pause` recording handler
	 */
	pause: () => void;

	/**
	 * `resume` recording handler
	 */
	resume: () => void;

	/**
	 * `stop` recording handler
	 */
	stop: () => void;

	/**
	 * The current recording state
	 */
	state: RecordingStateProp;
};

/**
 * react custom hook to handle media recording.
 *
 * @returns {UseMediaRecordingReturn} The media recorder instance
 */
export default function useMediaRecording(): UseMediaRecordingReturn {
	// Reference to the media recorder instance
	const mediaRecordRef = useRef( null );

	// Recording state: `inactive`, `recording`, `paused`
	const [ state, setState ] = useState< RecordingStateProp >( 'inactive' );

	// `start` recording handler
	const start = useCallback( () => {
		mediaRecordRef?.current?.start();
	}, [] );

	// `pause` recording handler
	const pause = useCallback( () => {
		mediaRecordRef?.current?.pause();
	}, [] );

	// `resume` recording handler
	const resume = useCallback( () => {
		mediaRecordRef?.current?.resume();
	}, [] );

	// `stop` recording handler
	const stop = useCallback( () => {
		mediaRecordRef?.current?.stop();
	}, [] );

	/**
	 * `start` event listener for the media recorder instance.
	 */
	function onStartListener() {
		setState( 'recording' );
	}

	/**
	 * `stop` event listener for the media recorder instance.
	 */
	function onStopListener() {
		setState( 'inactive' );
	}

	/**
	 * `pause` event listener for the media recorder instance.
	 */
	function onPauseListener() {
		setState( 'paused' );
	}

	/**
	 * `resume` event listener for the media recorder instance.
	 */
	function onResumeListener() {
		setState( 'recording' );
	}

	// Create media recorder instance
	useEffect( () => {
		// Check if the getUserMedia API is supported
		if ( ! navigator.mediaDevices?.getUserMedia ) {
			return;
		}

		const constraints = { audio: true };

		navigator.mediaDevices
			.getUserMedia( constraints )
			.then( stream => {
				mediaRecordRef.current = new MediaRecorder( stream );

				mediaRecordRef.current.addEventListener( 'start', onStartListener );
				mediaRecordRef.current.addEventListener( 'stop', onStopListener );
				mediaRecordRef.current.addEventListener( 'pause', onPauseListener );
				mediaRecordRef.current.addEventListener( 'resume', onResumeListener );
			} )
			.catch( err => {
				// @todo: handle error
				throw err;
			} );
		return () => {
			mediaRecordRef.current.removeEventListener( 'start', onStartListener );
			mediaRecordRef.current.removeEventListener( 'stop', onStopListener );
			mediaRecordRef.current.removeEventListener( 'pause', onPauseListener );
			mediaRecordRef.current.removeEventListener( 'resume', onResumeListener );
		};
	}, [] );

	return {
		start,
		pause,
		resume,
		stop,
		state,
	};
}
