export const ERROR_SERVICE_UNAVAILABLE = 'error_service_unavailable' as const;
export const ERROR_QUOTA_EXCEEDED = 'error_quota_exceeded' as const;
export const ERROR_MODERATION = 'error_moderation' as const;
export const ERROR_CONTEXT_TOO_LARGE = 'error_context_too_large' as const;
export const ERROR_NETWORK = 'error_network' as const;
export const ERROR_UNCLEAR_PROMPT = 'error_unclear_prompt' as const;
export const ERROR_RESPONSE = 'error_response' as const;

export type SuggestionErrorCode =
	| typeof ERROR_SERVICE_UNAVAILABLE
	| typeof ERROR_QUOTA_EXCEEDED
	| typeof ERROR_MODERATION
	| typeof ERROR_CONTEXT_TOO_LARGE
	| typeof ERROR_NETWORK
	| typeof ERROR_UNCLEAR_PROMPT
	| typeof ERROR_RESPONSE;

/*
 * Prompt types
 */
export type PromptItemProps = {
	role: 'system' | 'user' | 'assistant' | 'jetpack-ai';
	content?: string;
	context?: object;
};

export type PromptMessagesProp = Array< PromptItemProps >;

export type PromptProp = PromptMessagesProp | string;

/*
 * Data Flow types
 */
export type { UseAiContextOptions } from './data-flow/use-ai-context.js';

/*
 * Hook types
 */
export type { RequestingErrorProps } from './hooks/use-ai-suggestions/index.js';
export type {
	UseAudioTranscriptionProps,
	UseAudioTranscriptionReturn,
} from './hooks/use-audio-transcription/index.js';
export type {
	UseTranscriptionPostProcessingProps,
	UseTranscriptionPostProcessingReturn,
	PostProcessingAction,
} from './hooks/use-transcription-post-processing/index.js';
export type {
	UseAudioValidationReturn,
	ValidatedAudioInformation,
} from './hooks/use-audio-validation/index.js';

/*
 * Hook constants
 */
export { TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT } from './hooks/use-transcription-post-processing/index.js';

/*
 * Requests types
 */
const REQUESTING_STATE_INIT = 'init' as const;
const REQUESTING_STATE_REQUESTING = 'requesting' as const;
const REQUESTING_STATE_SUGGESTING = 'suggesting' as const;
const REQUESTING_STATE_DONE = 'done' as const;
const REQUESTING_STATE_ERROR = 'error' as const;

export const REQUESTING_STATES = [
	REQUESTING_STATE_INIT,
	REQUESTING_STATE_REQUESTING,
	REQUESTING_STATE_SUGGESTING,
	REQUESTING_STATE_DONE,
	REQUESTING_STATE_ERROR,
] as const;

export type RequestingStateProp = ( typeof REQUESTING_STATES )[ number ];

/*
 * Model types and constants
 */
export const AI_MODEL_GPT_3_5_Turbo_16K = 'gpt-3.5-turbo-16k' as const;
export const AI_MODEL_GPT_4 = 'gpt-4' as const;

export type AiModelTypeProp = typeof AI_MODEL_GPT_3_5_Turbo_16K | typeof AI_MODEL_GPT_4;

/*
 * Media recording types
 */
export type { RecordingState } from './hooks/use-media-recording/index.js';

/*
 * Utility types
 */
export type CancelablePromise< T = void > = Promise< T > & { canceled?: boolean };

export type Block = {
	attributes?: {
		[ key: string ]: unknown;
	};
	clientId?: string;
	innerBlocks?: Block[];
	isValid?: boolean;
	name?: string;
	originalContent?: string;
};

/*
 * Transcription types
 */
export type TranscriptionState = RecordingState | 'validating' | 'processing' | 'error';

/*
 * Lib types
 */
export type { RenderHTMLRules } from './libs/index.js';
