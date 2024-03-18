/**
 * External dependencies
 */
import { useRef, useState, useEffect, useCallback } from '@wordpress/element';
/*
 * Types
 */
export type RecordingState = 'inactive' | 'recording' | 'paused' | 'error';
type UseMediaRecordingProps = {
	onDone?: ( blob: Blob ) => void;
};

/**
 * Media types
 */
const MEDIA_TYPE_MP4_MP4A = 'audio/mp4;codecs=mp4a';
const MEDIA_TYPE_MP4 = 'audio/mp4';
const MEDIA_TYPE_WEBM = 'audio/webm';

type UseMediaRecordingReturn = {
	/**
	 * The current recording state
	 */
	state: RecordingState;

	/**
	 * The recorded blob
	 */
	blob: Blob | null;

	/**
	 * The error message
	 */
	error: string | null;

	/**
	 * The duration of the recorded audio
	 */
	duration: number;

	/**
	 * The audio analyser node
	 */
	analyser?: AnalyserNode;

	/**
	 * The error handler
	 */
	onError: ( err: string | Error ) => void;

	controls: {
		/**
		 * `start` recording handler
		 */
		start: ( timeslice?: number ) => void;

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
		 * `reset` recording handler
		 */
		reset: () => void;
	};
};

type MediaRecorderEvent = {
	data: Blob;
};

/**
 * react custom hook to handle media recording.
 *
 * @param {UseMediaRecordingProps} props - The props
 * @returns {UseMediaRecordingReturn} The media recorder instance
 */
export default function useMediaRecording( {
	onDone,
}: UseMediaRecordingProps = {} ): UseMediaRecordingReturn {
	// Reference to the media recorder instance
	const mediaRecordRef = useRef( null );

	// Recording state: `inactive`, `recording`, `paused`, `error`
	const [ state, setState ] = useState< RecordingState >( 'inactive' );

	// reference to the paused state to be used in the `onDataAvailable` event listener,
	// as the `mediaRecordRef.current.state` is already `inactive` when the recorder is stopped,
	// and the event listener does not react to state changes
	const isPaused = useRef< boolean >( false );

	const recordStartTimestamp = useRef< number >( 0 );
	const [ duration, setDuration ] = useState< number >( 0 );

	const audioStream = useRef< MediaStream | null >( null );

	// The recorded blob
	const [ blob, setBlob ] = useState< Blob | null >( null );

	// Store the recorded chunks
	const recordedChunks = useRef< Array< Blob > >( [] ).current;

	const [ error, setError ] = useState< string | null >( null );

	const analyser = useRef< AnalyserNode >( null );

	/**
	 * Get the recorded blob.
	 *
	 * @returns {Blob} The recorded blob
	 */
	function getBlob() {
		if ( MediaRecorder.isTypeSupported( MEDIA_TYPE_MP4_MP4A ) ) {
			return new Blob( recordedChunks, { type: MEDIA_TYPE_MP4 } ); // omit the codecs parameter
		}

		return new Blob( recordedChunks, { type: MEDIA_TYPE_WEBM } );
	}

	// `start` recording handler
	const start = useCallback( ( timeslice: number ) => {
		clearData();

		if ( ! timeslice ) {
			return mediaRecordRef?.current?.start();
		}

		if ( timeslice < 100 ) {
			timeslice = 100; // set minimum timeslice to 100ms
		}

		// Record the start time
		recordStartTimestamp.current = Date.now();

		mediaRecordRef?.current?.start( timeslice );
	}, [] );

	// `pause` recording handler
	const pause = useCallback( () => {
		isPaused.current = true;
		mediaRecordRef?.current?.pause();

		// Calculate the duration of the recorded audio from the start time
		setDuration( currentDuration => currentDuration + Date.now() - recordStartTimestamp.current );
	}, [] );

	// `resume` recording handler
	const resume = useCallback( () => {
		isPaused.current = false;
		mediaRecordRef?.current?.resume();

		// Record the start time
		recordStartTimestamp.current = Date.now();
	}, [] );

	// `stop` recording handler
	const stop = useCallback( () => {
		mediaRecordRef?.current?.stop();

		if ( state === 'recording' ) {
			// Calculate the duration of the recorded audio from the start time
			setDuration( currentDuration => currentDuration + Date.now() - recordStartTimestamp.current );
		}
	}, [] );

	// clears the recording state
	const clearData = useCallback( () => {
		recordedChunks.length = 0;
		setBlob( null );
		setError( null );
		setDuration( 0 );
		isPaused.current = false;
		recordStartTimestamp.current = 0;
	}, [] );

	// removes the event listeners
	const clearListeners = useCallback( () => {
		/*
		 * mediaRecordRef is not defined when
		 * the getUserMedia API is not supported,
		 * or when the user has not granted access
		 */
		if ( ! mediaRecordRef?.current ) {
			return;
		}

		mediaRecordRef.current.removeEventListener( 'start', onStartListener );
		mediaRecordRef.current.removeEventListener( 'stop', onStopListener );
		mediaRecordRef.current.removeEventListener( 'pause', onPauseListener );
		mediaRecordRef.current.removeEventListener( 'resume', onResumeListener );
		mediaRecordRef.current.removeEventListener( 'dataavailable', onDataAvailableListener );
		mediaRecordRef.current = null;
	}, [] );

	// resets the recording state, initializing the media recorder instance
	const reset = useCallback( () => {
		setState( 'inactive' );
		clearData();
		clearListeners();

		// Check if the getUserMedia API is supported
		if ( ! navigator.mediaDevices?.getUserMedia ) {
			return;
		}

		const audioCtx = new AudioContext();
		analyser.current = audioCtx.createAnalyser();

		const constraints = { audio: true };

		navigator.mediaDevices
			.getUserMedia( constraints )
			.then( stream => {
				audioStream.current = stream;
				const source = audioCtx.createMediaStreamSource( stream );
				source.connect( analyser.current );

				/**
				 * Special handling for iOS devices.
				 */
				if ( MediaRecorder.isTypeSupported( MEDIA_TYPE_MP4_MP4A ) ) {
					mediaRecordRef.current = new MediaRecorder( stream, { mimeType: MEDIA_TYPE_MP4_MP4A } );
				} else {
					mediaRecordRef.current = new MediaRecorder( stream, { mimeType: MEDIA_TYPE_WEBM } );
				}

				mediaRecordRef.current.addEventListener( 'start', onStartListener );
				mediaRecordRef.current.addEventListener( 'stop', onStopListener );
				mediaRecordRef.current.addEventListener( 'pause', onPauseListener );
				mediaRecordRef.current.addEventListener( 'resume', onResumeListener );
				mediaRecordRef.current.addEventListener( 'dataavailable', onDataAvailableListener );
			} )
			.catch( err => {
				// @todo: handle error
				throw err;
			} );
	}, [] );

	// stops the recording and sets the error state
	const onError = useCallback( ( err: string | Error ) => {
		stop();
		setError( typeof err === 'string' ? err : err.message );
		setState( 'error' );
	}, [] );

	/**
	 * `start` event listener for the media recorder instance.
	 */
	function onStartListener() {
		setState( 'recording' );
	}

	/**
	 * `stop` event listener for the media recorder instance.
	 * Happens after the last `dataavailable` event.
	 *
	 * @returns {void}
	 */
	function onStopListener(): void {
		const lastBlob = getBlob();
		onDone?.( lastBlob );

		// Clear the recorded chunks
		recordedChunks.length = 0;
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

	/**
	 * `dataavailable` event listener for the media recorder instance.
	 *
	 * @param {MediaRecorderEvent} event - The event object
	 * @returns {void}
	 */
	function onDataAvailableListener( event: MediaRecorderEvent ): void {
		const { data } = event;
		if ( ! data?.size ) {
			return;
		}

		// Store the recorded chunks
		recordedChunks.push( data );

		// Create and store the Blob for the recorded chunks
		setBlob( getBlob() );

		// If the recorder was paused, it is the last data available event, so we do not update the duration
		if ( ! isPaused.current ) {
			setDuration( currentDuration => {
				const now = Date.now();
				const difference = now - recordStartTimestamp.current;
				// Update the start time
				recordStartTimestamp.current = now;
				return currentDuration + difference;
			} );
		}
	}

	/**
	 * Close the audio stream
	 */
	function closeStream() {
		if ( audioStream.current ) {
			const tracks = audioStream.current.getTracks();
			tracks.forEach( track => track.stop() );
		}
	}

	// Remove listeners and clear the recorded chunks
	useEffect( () => {
		reset();

		return () => {
			closeStream();
			clearListeners();
		};
	}, [] );

	return {
		state,
		blob,
		error,
		duration,
		analyser: analyser.current,
		onError,

		controls: {
			start,
			pause,
			resume,
			stop,
			reset,
		},
	};
}
