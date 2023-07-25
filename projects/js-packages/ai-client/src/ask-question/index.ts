/**
 * External dependencies
 */
import debugFactory from 'debug';
import requestJwt from '../jwt';
import SuggestionsEventSource from '../suggestions-event-source';
/*
 * Types & constants
 */
import type { PromptItemProps } from '../types';

type AskQuestionOptionsArgProps = {
	/*
	 * ID of the post where the question is asked.
	 */
	postId?: number;

	/*
	 * If set to true, the answer will be fetched from the cache. Default value is false.
	 */
	fromCache?: boolean;

	/*
	 * Allows to use a specific AI assistant feature. Default value is undefined.
	 */
	feature?: 'ai-assistant-experimental' | string | undefined;
};

const debug = debugFactory( 'jetpack-ai-client:ask-question' );

/**
 * An asynchronous function that asks a question
 * and returns an event source with suggestions.
 *
 * @param {string|PromptItemProps[]} question - The question to ask. It can be a simple string or an array of PromptItemProps objects.
 * @param {AskQuestionOptionsArgProps} options - An optional object for additional configuration:
 * @returns {Promise<SuggestionsEventSource>}    A promise that resolves to an instance of the SuggestionsEventSource
 * @example
 *  const question = "What is the meaning of life?";
 *  const options = {
 *      postId: 1,
 *      fromCache: true,
 *      feature: 'ai-assistant-experimental'
 *  }
 *  askQuestion( question, options ).then( suggestionsEventSource => {
 *      // handle suggestionsEventSource
 *  } );
 */
export default async function askQuestion(
	question: string | PromptItemProps[],
	{ postId = null, fromCache = false, feature }: AskQuestionOptionsArgProps = {}
): Promise< SuggestionsEventSource > {
	debug( 'Asking question: %o. options: %o', question, { postId, fromCache, feature } );

	const { token } = await requestJwt();

	return new SuggestionsEventSource( { question, token, options: { postId, feature, fromCache } } );
}
