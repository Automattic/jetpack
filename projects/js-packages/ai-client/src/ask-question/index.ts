/**
 * External dependencies
 */
import requestJwt from '../jwt';
import SuggestionsEventSource from '../suggestions-event-source';
/*
 * Types & constants
 */
import type { PromptItemProps } from '../types';

type AskQuestionOptionsArgProps = {
	postId?: number;
	fromCache?: boolean;
	feature?: 'ai-assistant-experimental' | string | undefined;
};

/**
 * Leaving this here to make it easier to debug the streaming API calls for now
 *
 * @param {string|PromptItemProps[]} question  - The question to ask
 * @param {AskQuestionOptionsArgProps} options - Options
 * @returns {Promise<SuggestionsEventSource>}    The event source
 */
export async function askQuestion(
	question: string | PromptItemProps[],
	{ postId = null, fromCache = false, feature }: AskQuestionOptionsArgProps = {}
): Promise< SuggestionsEventSource > {
	const { token } = await requestJwt();
	return new SuggestionsEventSource( { question, token, options: { postId, feature, fromCache } } );
}
