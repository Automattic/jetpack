/**
 * External dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import transcribeAudio from '../../audio-transcription/index.js';
/**
 * Types
 */
import type { CancelablePromise } from '../../types.js';

const debug = debugFactory( 'jetpack-ai-client:use-audio-transcription' );

/**
 * The response from the audio transcription hook.
 */
export type UseAudioTranscriptionReturn = {
	transcriptionResult: string;
	isTranscribingAudio: boolean;
	transcriptionError: string;
	transcribeAudio: ( audio: Blob ) => CancelablePromise;
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

	const handleAudioTranscription = useCallback(
		( audio: Blob ) => {
			debug( 'Transcribing audio' );

			/**
			 * Reset the transcription result and error.
			 */
			setTranscriptionResult( '' );
			setTranscriptionError( '' );
			setIsTranscribingAudio( true );

			/**
			 * Call the audio transcription library.
			 */
			const promise: CancelablePromise = transcribeAudio( audio, feature )
				.then( transcriptionText => {
					if ( promise.canceled ) {
						return;
					}

					setTranscriptionResult( transcriptionText );
					onReady?.( transcriptionText );
				} )
				.catch( error => {
					if ( promise.canceled ) {
						return;
					}

					setTranscriptionError( error.message );
					onError?.( error.message );
				} )
				.finally( () => setIsTranscribingAudio( false ) );

			return promise;
		},
		[ transcribeAudio, setTranscriptionResult, setTranscriptionError, setIsTranscribingAudio ]
	);

	return {
		transcriptionResult,
		isTranscribingAudio,
		transcriptionError,
		transcribeAudio: handleAudioTranscription,
	};
}
