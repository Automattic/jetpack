/**
 * External dependencies
 */
import { useCallback, useState, useRef } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import transcribeAudio from '../../audio-transcription/index.js';

const debug = debugFactory( 'jetpack-ai-client:use-audio-transcription' );

/**
 * The response from the audio transcription hook.
 */
export type UseAudioTranscriptionReturn = {
	transcriptionResult: string;
	isTranscribingAudio: boolean;
	transcriptionError: string;
	transcribeAudio: ( audio: Blob ) => void;
	cancelTranscription: () => void;
};

/**
 * The props for the audio transcription hook.
 */
export type UseAudioTranscriptionProps = {
	feature: string;
	onReady?: ( transcription: string ) => void;
	onError?: ( error: string ) => void;
};

/**
 * A hook to handle audio transcription.
 *
 * @param {string} feature - The feature name that is calling the transcription.
 * @returns {UseAudioTranscriptionReturn} - Object with properties to get the transcription data.
 */
export default function useAudioTranscription( {
	feature,
	onReady,
	onError,
}: UseAudioTranscriptionProps ): UseAudioTranscriptionReturn {
	const [ transcriptionResult, setTranscriptionResult ] = useState< string >( '' );
	const [ transcriptionError, setTranscriptionError ] = useState< string >( '' );
	const [ isTranscribingAudio, setIsTranscribingAudio ] = useState( false );
	const abortController = useRef< AbortController >( null );

	const handleAudioTranscription = useCallback(
		( audio: Blob ) => {
			debug( 'Transcribing audio' );

			/**
			 * Reset the transcription result and error.
			 */
			setTranscriptionResult( '' );
			setTranscriptionError( '' );
			setIsTranscribingAudio( true );

			/*
			 * Create an AbortController to cancel the transcription.
			 */
			const controller = new AbortController();
			abortController.current = controller;

			/**
			 * Call the audio transcription library.
			 */
			transcribeAudio( audio, feature, controller.signal )
				.then( transcriptionText => {
					setTranscriptionResult( transcriptionText );
					onReady?.( transcriptionText );
				} )
				.catch( error => {
					if ( ! controller.signal.aborted ) {
						setTranscriptionError( error.message );
						onError?.( error.message );
					}
				} )
				.finally( () => setIsTranscribingAudio( false ) );
		},
		[ transcribeAudio, setTranscriptionResult, setTranscriptionError, setIsTranscribingAudio ]
	);

	const handleAudioTranscriptionCancelled = useCallback( () => {
		/*
		 * Cancel the transcription.
		 */
		abortController.current?.abort();
		/*
		 * Reset the transcription result and error.
		 */
		setTranscriptionResult( '' );
		setTranscriptionError( '' );
		setIsTranscribingAudio( false );
	}, [ abortController, setTranscriptionResult, setTranscriptionError, setIsTranscribingAudio ] );

	return {
		transcriptionResult,
		isTranscribingAudio,
		transcriptionError,
		transcribeAudio: handleAudioTranscription,
		cancelTranscription: handleAudioTranscriptionCancelled,
	};
}
