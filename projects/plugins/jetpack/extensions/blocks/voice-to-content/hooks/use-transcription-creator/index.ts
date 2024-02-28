/**
 * External dependencies
 */
import {
	useAudioTranscription,
	UseAudioTranscriptionReturn,
	useTranscriptionPostProcessing,
	PostProcessingAction,
} from '@automattic/jetpack-ai-client';
import { useCallback, useRef } from '@wordpress/element';
import debugFactory from 'debug';

const debug = debugFactory( 'voice-to-content:use-transcription-creator' );

const VOICE_TO_CONTENT_FEATURE = 'voice-to-content';

/**
 * The props for the transcription creator hook.
 */
export type UseTranscriptionCreatorProps = {
	onReady: ( content: string ) => void;
	onUpdate: ( content: string ) => void;
	onError: ( error: string ) => void;
};

/**
 * The return value for the transcription creator hook.
 */
export type UseTranscriptionCreatorReturn = {
	isCreatingTranscription: boolean;
	createTranscription: ( audio: Blob, action: PostProcessingAction ) => void;
	cancelTranscription: () => void;
};

/**
 * Hook to handle the creation of a transcription.
 *
 * @param {UseTranscriptionCreatorProps} props - Callbacks to handle the transcription when it's ready, updated or fails.
 * @returns {UseTranscriptionCreatorReturn} - Object with functions to handle transcription creation.
 */
export default function useTranscriptionCreator( {
	onReady,
	onUpdate,
	onError,
}: UseTranscriptionCreatorProps ): UseTranscriptionCreatorReturn {
	const transcription = useRef< string >( null );
	const postProcessingAction = useRef< PostProcessingAction >( null );

	const { processTranscription, cancelTranscriptionProcessing, isProcessingTranscription } =
		useTranscriptionPostProcessing( {
			feature: VOICE_TO_CONTENT_FEATURE,
			onReady: onReady,
			onUpdate: onUpdate,
			onError: error => {
				// In case of post-processing error, use the raw transcription instead for a partial result
				if ( transcription.current ) {
					return onReady( transcription.current );
				}

				// No action over the transcription, just log the error
				debug( 'Transcription post-processing error: ', error );
			},
		} );

	const onTranscriptionReady = useCallback(
		( content: string ) => {
			transcription.current = content;
			if ( postProcessingAction.current ) {
				processTranscription( postProcessingAction.current, content );
			}
		},
		[ processTranscription ]
	);

	const { transcribeAudio, cancelTranscription, isTranscribingAudio }: UseAudioTranscriptionReturn =
		useAudioTranscription( {
			feature: VOICE_TO_CONTENT_FEATURE,
			onReady: onTranscriptionReady,
			onError: onError,
		} );

	const handleCreateTranscription = useCallback(
		( audio: Blob, action: PostProcessingAction ) => {
			if ( audio && action ) {
				postProcessingAction.current = action;
				return transcribeAudio( audio );
			}
		},
		[ transcribeAudio ]
	);

	const handleCancelTranscription = useCallback( () => {
		cancelTranscription();
		cancelTranscriptionProcessing();
	}, [ cancelTranscription, cancelTranscriptionProcessing ] );

	return {
		isCreatingTranscription: isTranscribingAudio || isProcessingTranscription,
		createTranscription: handleCreateTranscription,
		cancelTranscription: handleCancelTranscription,
	};
}
