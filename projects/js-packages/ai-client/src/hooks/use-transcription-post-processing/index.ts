/**
 * External dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import useAiSuggestions, { RequestingErrorProps } from '../use-ai-suggestions/index.js';
import type { PromptProp } from '../../types.js';

const debug = debugFactory( 'jetpack-ai-client:use-transcription-post-processing' );

/**
 * Post-processing types.
 */
export const TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT = 'voice-to-content-simple-draft';
export type PostProcessingAction = typeof TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT;

/**
 * The return value for the transcription post-processing hook.
 */
export type UseTranscriptionPostProcessingReturn = {
	postProcessingResult: string;
	isProcessingTranscription: boolean;
	postProcessingError: string;
	processTranscription: ( action: PostProcessingAction, transcription: string ) => void;
	cancelTranscriptionProcessing: () => void;
};

/**
 * The props for the transcription post-processing hook.
 */
export type UseTranscriptionPostProcessingProps = {
	feature: string;
	onReady?: ( postProcessingResult: string ) => void;
	onError?: ( error: string ) => void;
	onUpdate?: ( currentPostProcessingResult: string ) => void;
};

/**
 * A hook to handle transcription post-processing.
 *
 * @param {string} feature - The feature name that is calling the post-processing actions.
 * @returns {UseTranscriptionPostProcessingReturn} - Object with properties to get the post-processing results.
 */
export default function useTranscriptionPostProcessing( {
	feature,
	onReady,
	onError,
	onUpdate,
}: UseTranscriptionPostProcessingProps ): UseTranscriptionPostProcessingReturn {
	const [ postProcessingResult, setPostProcessingResult ] = useState< string >( '' );
	const [ postProcessingError, setPostProcessingError ] = useState< string >( '' );
	const [ isProcessingTranscription, setIsProcessingTranscription ] = useState( false );

	/**
	 * Set-up the useAiSuggestions hook.
	 */
	const handleOnSuggestion = useCallback(
		( suggestion: string ) => {
			setPostProcessingResult( suggestion );
			onUpdate?.( suggestion );
		},
		[ setPostProcessingResult, onUpdate ]
	);

	const handleOnDone = useCallback(
		( result: string ) => {
			setPostProcessingResult( result );
			onUpdate?.( result );
			onReady?.( result );
		},
		[ setPostProcessingResult, onUpdate, onReady ]
	);

	const handleOnError = useCallback(
		( errorData: RequestingErrorProps ) => {
			setPostProcessingError( errorData.message );
			onError?.( errorData.message );
		},
		[ setPostProcessingError, onError ]
	);

	const { request, stopSuggestion } = useAiSuggestions( {
		onSuggestion: handleOnSuggestion,
		onDone: handleOnDone,
		onError: handleOnError,
	} );

	const handleTranscriptionPostProcessing = useCallback(
		( action: PostProcessingAction, transcription: string ) => {
			debug( 'Post-processing transcription' );

			/**
			 * Reset the transcription result and error.
			 */
			setPostProcessingResult( '' );
			setPostProcessingError( '' );
			setIsProcessingTranscription( true );

			/**
			 * Build the prompt to call the suggestion hook.
			 */
			const messages: PromptProp = [
				{
					role: 'jetpack-ai',
					context: {
						type: action,
						content: transcription,
					},
				},
			];

			/**
			 * Call the suggestion hook using the message.
			 */
			request( messages, { feature } );
		},
		[
			setPostProcessingResult,
			setPostProcessingError,
			setIsProcessingTranscription,
			request,
			feature,
		]
	);

	const handleTranscriptionPostProcessingCancel = useCallback( () => {
		/*
		 * Stop the suggestion streaming.
		 */
		stopSuggestion();
		setIsProcessingTranscription( false );
	}, [ stopSuggestion, setIsProcessingTranscription ] );

	return {
		postProcessingResult,
		isProcessingTranscription,
		postProcessingError,
		processTranscription: handleTranscriptionPostProcessing,
		cancelTranscriptionProcessing: handleTranscriptionPostProcessingCancel,
	};
}
