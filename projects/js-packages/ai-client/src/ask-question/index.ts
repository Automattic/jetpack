/**
 * External dependencies
 */
import debugFactory from 'debug';
import SuggestionsEventSource from '../suggestions-event-source/index.js';
/*
 * Types & constants
 */
import type { AiModelTypeProp, PromptProp } from '../types.js';

export type AskQuestionOptionsArgProps = {
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

	/*
	 * Allows to use a specific AI model.
	 */
	model?: AiModelTypeProp;

	/*
	 * Allows the use of function calling. Default value is undefined.
	 */
	functions?: Array< {
		name?: string;
		arguments?: string;
		// eslint-disable-next-line @typescript-eslint/ban-types
		implementation?: Function;
	} >;
};

const debug = debugFactory( 'jetpack-ai-client:ask-question' );

/**
 * An asynchronous function that asks a question
 * and returns an event source with suggestions.
 *
 * @param {PromptProp} question - The question to ask. It can be a simple string or an array of PromptMessageItemProps objects.
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
	question: PromptProp,
	{ postId = null, fromCache = false, feature, functions, model }: AskQuestionOptionsArgProps = {}
): Promise< SuggestionsEventSource > {
	debug( 'Asking question: %o. options: %o', question, {
		postId,
		fromCache,
		feature,
		functions,
		model,
	} );

	return new SuggestionsEventSource( {
		question,
		options: { postId, feature, fromCache, functions, model },
	} );
}
