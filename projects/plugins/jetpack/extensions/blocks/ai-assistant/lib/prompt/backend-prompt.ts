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
	PromptItemProps,
	BuildPromptProps,
} from './index';

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
	return [
		{
			role: 'jetpack-ai',
			context: buildMessageContextForBackendPrompt( {
				generatedContent,
				allPostContent,
				postContentAbove,
				currentPostTitle,
				options,
				type,
				userPrompt,
				isGeneratingTitle,
			} ),
		},
	];
}

/**
 * Builds backend message context based on the type
 * and the options of the prompt.
 *
 * @param {BuildPromptProps} options - The prompt options.
 * @returns {object} The context.
 */
function buildMessageContextForBackendPrompt( {
	generatedContent,
	allPostContent,
	postContentAbove,
	currentPostTitle,
	options,
	type,
	userPrompt,
	isGeneratingTitle,
}: BuildPromptProps ): object {
	const isContentGenerated = options?.contentType === 'generated';

	// Determine the subject of the action
	let subject = 'last-answer';
	if ( isGeneratingTitle ) {
		subject = 'title';
	} else if ( ! isContentGenerated ) {
		subject = 'content';
	}

	/*
	 * Each type of prompt has a different context.
	 * The context is used to identify the prompt type in the backend,
	 * as well as provide relevant pieces for the prompt building.
	 */

	if ( type === PROMPT_TYPE_SUMMARY_BY_TITLE ) {
		return {
			type: 'ai-assistant-summary-by-title',
			content: currentPostTitle,
		};
	}

	if ( type === PROMPT_TYPE_CONTINUE ) {
		return {
			type: 'ai-assistant-continue',
			content: postContentAbove,
		};
	}

	if ( type === PROMPT_TYPE_SIMPLIFY ) {
		return {
			type: 'ai-assistant-simplify',
			content: isContentGenerated ? generatedContent : postContentAbove,
			subject,
		};
	}

	if ( type === PROMPT_TYPE_CORRECT_SPELLING ) {
		return {
			type: 'ai-assistant-correct-spelling',
			content: isContentGenerated ? generatedContent : postContentAbove,
			subject,
		};
	}

	if ( type === PROMPT_TYPE_GENERATE_TITLE ) {
		return {
			type: 'ai-assistant-generate-title',
			content: allPostContent,
		};
	}

	if ( type === PROMPT_TYPE_MAKE_LONGER ) {
		return {
			type: 'ai-assistant-make-longer',
			content: generatedContent,
			subject,
		};
	}

	if ( type === PROMPT_TYPE_MAKE_SHORTER ) {
		return {
			type: 'ai-assistant-make-shorter',
			content: generatedContent,
			subject,
		};
	}

	if ( type === PROMPT_TYPE_CHANGE_TONE ) {
		return {
			type: 'ai-assistant-change-tone',
			content: isContentGenerated ? generatedContent : allPostContent,
			tone: options?.tone,
			subject,
		};
	}

	if ( type === PROMPT_TYPE_SUMMARIZE ) {
		return {
			type: 'ai-assistant-summarize',
			content: isContentGenerated ? generatedContent : allPostContent,
			subject,
		};
	}

	if ( type === PROMPT_TYPE_CHANGE_LANGUAGE ) {
		return {
			type: 'ai-assistant-change-language',
			content: isContentGenerated ? generatedContent : allPostContent,
			language: options?.language,
			subject,
		};
	}

	// default to the user prompt
	return {
		type: 'ai-assistant-user-prompt',
		request: userPrompt,
		content: generatedContent || allPostContent,
	};
}
