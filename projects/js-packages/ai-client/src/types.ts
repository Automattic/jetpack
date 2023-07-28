export const ERROR_SERVICE_UNAVAILABLE = 'error_service_unavailable' as const;
export const ERROR_QUOTA_EXCEEDED = 'error_quota_exceeded' as const;
export const ERROR_MODERATION = 'error_moderation' as const;
export const ERROR_NETWORK = 'error_network' as const;
export const ERROR_UNCLEAR_PROMPT = 'error_unclear_prompt' as const;

export type SuggestionErrorCode =
	| typeof ERROR_SERVICE_UNAVAILABLE
	| typeof ERROR_QUOTA_EXCEEDED
	| typeof ERROR_MODERATION
	| typeof ERROR_NETWORK
	| typeof ERROR_UNCLEAR_PROMPT;

/*
 * Prompt types
 */
export type PromptItemProps = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

export type PromptMessagesProps = {
	prompt: Array< PromptItemProps >;
};

export type PromptTypeProp = PromptMessagesProps | string;
