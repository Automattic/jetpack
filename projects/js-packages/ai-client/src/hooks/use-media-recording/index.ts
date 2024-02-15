/**
 * External dependencies
 */
import { useRef, useState, useEffect, useCallback } from '@wordpress/element';

/*
 * Types
 */
type RecordingStateProp = 'inactive' | 'recording' | 'paused';
type UseMediaRecordingProps = {
	onDone?: ( blob: Blob ) => void;
};

type UseMediaRecordingReturn = {
	/**
	 * The current recording state
	 */
	state: RecordingStateProp;

	/**
	 * The recorded blob
	 */
	blob: Blob | null;

	/**
	 * The recorded blob url
	 */
	url: string | null;

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

	// Recording state: `inactive`, `recording`, `paused`
	const [ state, setState ] = useState< RecordingStateProp >( 'inactive' );

	// The recorded blob
	const [ blob, setBlob ] = useState< Blob | null >( null );

	// Store the recorded chunks
	const recordedChunks = useRef< Array< Blob > >( [] ).current;

	/**
	 * Get the recorded blob.
	 *
	 * @returns {Blob} The recorded blob
	 */
	function getBlob() {
		return new Blob( recordedChunks, {
			type: 'audio/webm',
		} );
	}

	// `start` recording handler
	const start = useCallback( ( timeslice: number ) => {
		if ( ! timeslice ) {
			return mediaRecordRef?.current?.start();
		}

		if ( timeslice < 100 ) {
			timeslice = 100; // set minimum timeslice to 100ms
		}
		mediaRecordRef?.current?.start( timeslice );
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
	 *
	 * @returns {void}
	 */
	function onStopListener(): void {
		setState( 'inactive' );
		onDone?.( getBlob() );

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
				mediaRecordRef.current.addEventListener( 'dataavailable', onDataAvailableListener );
			} )
			.catch( err => {
				// @todo: handle error
				throw err;
			} );

		return () => {
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
		};
	}, [] );

	return {
		state,
		blob,
		url: blob ? URL.createObjectURL( blob ) : null,

		controls: {
			start,
			pause,
			resume,
			stop,
		},
	};
}
