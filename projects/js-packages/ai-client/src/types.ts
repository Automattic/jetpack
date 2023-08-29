export const ERROR_SERVICE_UNAVAILABLE = 'error_service_unavailable' as const;
export const ERROR_QUOTA_EXCEEDED = 'error_quota_exceeded' as const;
export const ERROR_MODERATION = 'error_moderation' as const;
export const ERROR_NETWORK = 'error_network' as const;
export const ERROR_UNCLEAR_PROMPT = 'error_unclear_prompt' as const;
export const ERROR_RESPONSE = 'error_response' as const;

export type SuggestionErrorCode =
	| typeof ERROR_SERVICE_UNAVAILABLE
	| typeof ERROR_QUOTA_EXCEEDED
	| typeof ERROR_MODERATION
	| typeof ERROR_NETWORK
	| typeof ERROR_UNCLEAR_PROMPT
	| typeof ERROR_RESPONSE;

/*
 * Prompt types
 */
export type PromptItemProps = {
	role: 'system' | 'user' | 'assistant';
	content?: string;
	context?: object;
};

export type PromptMessagesProp = Array< PromptItemProps >;

export type PromptProp = PromptMessagesProp | string;

/*
 * Data Flow types
 */
export type { UseAiContextOptions } from './data-flow/use-ai-context';
export type { RequestingErrorProps } from './hooks/use-ai-suggestions';

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
