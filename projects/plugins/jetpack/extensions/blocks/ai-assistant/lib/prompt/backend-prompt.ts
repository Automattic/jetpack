/**
 * Internal dependencies
 */
import {
	PROMPT_TYPE_SUMMARY_BY_TITLE,
	PROMPT_TYPE_CONTINUE,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_GENERATE_TITLE,
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_MAKE_SHORTER,
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PROMPT_TYPE_USER_PROMPT,
	PromptTypeProp,
	PromptItemProps,
	BuildPromptProps,
} from './index';

/**
 * Constants
 */
const SUBJECT_TITLE = 'title';
const SUBJECT_CONTENT = 'content';
const SUBJECT_DEFAULT = null;

/**
 * Builds the initial message, that will be transformed on the
 * system prompt.
 *
 * @param {PromptTypeProp} promptType - The internal type of the prompt.
 * @returns {PromptItemProps} The initial message.
 */
export function buildInitialMessageForBackendPrompt( promptType: PromptTypeProp ): PromptItemProps {
	// The basic template for the message.
	return {
		role: 'jetpack-ai' as const,
		context: {
			type: 'ai-assistant-initial-prompt',
			for: mapInternalPromptTypeToBackendPromptType( promptType ),
		},
	};
}

/**
 * Builds the relevant content message, if applicable.
 *
 * @param {boolean} isContentGenerated - Whether the current content was generated.
 * @param {string} relevantContent - The relevant content.
 * @returns {PromptItemProps} The initial message.
 */
export function buildRelevantContentMessageForBackendPrompt(
	isContentGenerated?: boolean,
	relevantContent?: string | null
): PromptItemProps | null {
	if ( ! isContentGenerated && relevantContent && relevantContent.length > 0 ) {
		return {
			role: 'jetpack-ai',
			context: {
				type: 'ai-assistant-relevant-content',
				content: relevantContent,
			},
		};
	}

	return null;
}

/**
 * Builds backend prompt message list
 * based on the type of prompt.
 *
 * @param {BuildPromptProps} options - The prompt options.
 * @returns {Array< PromptItemProps >} The prompt.
 */
export function buildMessagesForBackendPrompt( {
	generatedContent,
	allPostContent,
	postContentAbove,
	currentPostTitle,
	options,
	type,
	userPrompt,
	isGeneratingTitle,
}: BuildPromptProps ): Array< PromptItemProps > {
	const messages: PromptItemProps[] = [];

	const isContentGenerated = options?.contentType === 'generated';
	let relevantContent: string | null | undefined = null;

	switch ( type ) {
		case PROMPT_TYPE_SUMMARY_BY_TITLE:
			relevantContent = currentPostTitle;
			break;
		case PROMPT_TYPE_CONTINUE:
		case PROMPT_TYPE_SIMPLIFY:
		case PROMPT_TYPE_CORRECT_SPELLING:
			relevantContent = postContentAbove;
			break;
		case PROMPT_TYPE_GENERATE_TITLE:
			relevantContent = allPostContent;
			break;
		case PROMPT_TYPE_MAKE_LONGER:
		case PROMPT_TYPE_MAKE_SHORTER:
			relevantContent = generatedContent;
			break;
		case PROMPT_TYPE_CHANGE_TONE:
		case PROMPT_TYPE_SUMMARIZE:
		case PROMPT_TYPE_CHANGE_LANGUAGE:
			relevantContent = isContentGenerated ? generatedContent : allPostContent;
			break;
		case PROMPT_TYPE_USER_PROMPT:
			relevantContent = generatedContent || allPostContent;
			break;
	}

	const relevantContentMessage = buildRelevantContentMessageForBackendPrompt(
		type === PROMPT_TYPE_USER_PROMPT ? !! generatedContent?.length : isContentGenerated,
		relevantContent
	);

	// If we have relevant content, send it as a message.
	if ( relevantContentMessage ) {
		messages.push( relevantContentMessage );
	}

	messages.push( {
		role: 'jetpack-ai',
		context: buildMessageContextForUserPrompt( {
			generatedContent,
			allPostContent,
			postContentAbove,
			currentPostTitle,
			options,
			type,
			userPrompt,
			isGeneratingTitle,
		} ),
	} );

	return messages;
}

/**
 * Gets the subject of the prompt.
 *
 * @param {boolean} isGeneratingTitle - Whether the action is to generate a title.
 * @param {boolean} isContentGenerated - Whether the current content was generated.
 * @param {boolean} isFromExtension - Whether the content is from the extension.
 * @returns {string} The subject.
 */
function getSubject(
	isGeneratingTitle?: boolean,
	isContentGenerated?: boolean,
	isFromExtension?: boolean
): string | null {
	if ( isGeneratingTitle ) {
		return SUBJECT_TITLE;
	}
	if ( ! isContentGenerated || isFromExtension ) {
		return SUBJECT_CONTENT;
	}

	return SUBJECT_DEFAULT;
}

/**
 * Builds backend message context based on the type
 * and the options of the prompt.
 *
 * @param {BuildPromptProps} options - The prompt options.
 * @returns {object} The context.
 */
export function buildMessageContextForUserPrompt( {
	options,
	type,
	userPrompt,
	isGeneratingTitle,
}: BuildPromptProps ): object {
	const isContentGenerated = options?.contentType === 'generated';
	const isFromExtension = options?.fromExtension || false;

	// Determine the subject of the action
	const subject = getSubject( isGeneratingTitle, isContentGenerated, isFromExtension );

	/*
	 * Each type of prompt has a different context.
	 * The context is used to identify the prompt type in the backend,
	 * as well as provide relevant pieces for the prompt building.
	 */

	return {
		type: mapInternalPromptTypeToBackendPromptType( type ),
		...( subject ? { subject } : {} ),
		...( type === PROMPT_TYPE_CHANGE_TONE && options?.tone ? { tone: options.tone } : {} ),
		...( type === PROMPT_TYPE_CHANGE_LANGUAGE && options?.language
			? { language: options.language }
			: {} ),
		...( type === PROMPT_TYPE_USER_PROMPT && userPrompt ? { request: userPrompt } : {} ),
	};
}

/**
 * Maps the internal prompt type to the backend prompt type.
 *
 * @param {PromptTypeProp} promptType - The internal type of the prompt.
 * @param {string} extension          - The extension of the prompt, if any.
 * @returns {string}                    The backend type of the prompt.
 */
export function mapInternalPromptTypeToBackendPromptType(
	promptType: PromptTypeProp,
	extension?: string
): string {
	const map = {
		[ PROMPT_TYPE_SUMMARY_BY_TITLE ]: 'ai-assistant-summary-by-title',
		[ PROMPT_TYPE_CONTINUE ]: 'ai-assistant-continue-writing',
		[ PROMPT_TYPE_SIMPLIFY ]: 'ai-assistant-simplify',
		[ PROMPT_TYPE_CORRECT_SPELLING ]: 'ai-assistant-correct-spelling',
		[ PROMPT_TYPE_GENERATE_TITLE ]: 'ai-assistant-generate-title',
		[ PROMPT_TYPE_MAKE_LONGER ]: 'ai-assistant-make-longer',
		[ PROMPT_TYPE_MAKE_SHORTER ]: 'ai-assistant-make-shorter',
		[ PROMPT_TYPE_CHANGE_TONE ]: 'ai-assistant-change-tone',
		[ PROMPT_TYPE_SUMMARIZE ]: 'ai-assistant-summarize',
		[ PROMPT_TYPE_CHANGE_LANGUAGE ]: 'ai-assistant-change-language',
		[ PROMPT_TYPE_USER_PROMPT ]: 'ai-assistant-user-prompt',
	};

	if ( extension ) {
		return `${ map[ promptType ] }-${ extension }-extension`;
	}

	return map[ promptType ];
}
