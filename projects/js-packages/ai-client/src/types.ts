import type * as BlockEditorSelectors from '@wordpress/block-editor/store/selectors.js';

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

export const ROLE_SYSTEM = 'system' as const;
export const ROLE_USER = 'user' as const;
export const ROLE_ASSISTANT = 'assistant' as const;
export const ROLE_JETPACK_AI = 'jetpack-ai' as const;

export type RoleType =
	| typeof ROLE_SYSTEM
	| typeof ROLE_USER
	| typeof ROLE_ASSISTANT
	| typeof ROLE_JETPACK_AI;

/*
 * Prompt types
 */
export type PromptItemProps = {
	role: RoleType;
	content?: string;
	context?: object;
};

export type PromptMessagesProp = Array< PromptItemProps >;

export type PromptProp = PromptMessagesProp | string;

/*
 * Data Flow types
 */
export type { UseAiContextOptions } from './data-flow/use-ai-context.ts';

/*
 * Hook types
 */
export type { RequestingErrorProps } from './hooks/use-ai-suggestions/index.ts';
export type {
	UseAudioTranscriptionProps,
	UseAudioTranscriptionReturn,
} from './hooks/use-audio-transcription/index.ts';
export type {
	UseTranscriptionPostProcessingProps,
	UseTranscriptionPostProcessingReturn,
	PostProcessingAction,
} from './hooks/use-transcription-post-processing/index.ts';
export type {
	UseAudioValidationReturn,
	ValidatedAudioInformation,
} from './hooks/use-audio-validation/index.ts';

/*
 * Hook constants
 */
export { TRANSCRIPTION_POST_PROCESSING_ACTION_SIMPLE_DRAFT } from './hooks/use-transcription-post-processing/index.ts';

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
export const AI_MODEL_DEFAULT = 'default' as const;
export const AI_MODEL_GEMINI_NANO = 'gemini-nano' as const;

export type AiModelTypeProp =
	| typeof AI_MODEL_GPT_3_5_Turbo_16K
	| typeof AI_MODEL_GPT_4
	| typeof AI_MODEL_GEMINI_NANO
	| typeof AI_MODEL_DEFAULT;

/*
 * Media recording types
 */
export type { RecordingState } from './hooks/use-media-recording/index.ts';

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
export type { RenderHTMLRules } from './libs/index.ts';

export interface BlockEditorStore {
	selectors: {
		[ key in keyof typeof BlockEditorSelectors ]: ( typeof BlockEditorSelectors )[ key ];
	};
}

declare global {
	interface Window {
		LanguageDetector?: {
			create: () => Promise< {
				detect: ( text: string ) => Promise<
					{
						detectedLanguage: string;
						confidence: number;
					}[]
				>;
				ready: Promise< void >;
			} >;
			availability: () => Promise<
				'unavailable' | 'available' | 'downloadable' | 'downloading' | string
			>;
		};
		Translator?: {
			create: ( options: {
				sourceLanguage: string;
				targetLanguage: string;
			} ) => Promise< { translate: ( text: string ) => Promise< string > } >;
			availability: ( options: {
				sourceLanguage: string;
				targetLanguage: string;
			} ) => Promise< 'unavailable' | 'available' | 'downloadable' | 'downloading' | string >;
		};
		Summarizer?: {
			availability: () => Promise<
				'unavailable' | 'available' | 'downloadable' | 'downloading' | string
			>;
			create: ( options: {
				sharedContext?: string;
				type?: string;
				format?: string;
				length?: string;
			} ) => Promise< {
				ready: Promise< void >;
				summarize: ( text: string, summarizeOptions?: { context?: string } ) => Promise< string >;
			} >;
		};
	}
}
