/**
 * External dependencies
 */
import { select } from '@wordpress/data';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import SuggestionsEventSource from '../suggestions-event-source/index.ts';
/**
 * Types & constants
 */
import type { AiModelTypeProp, PromptProp } from '../types.ts';

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
		// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
		implementation?: Function;
	} >;

	/*
	 * The language configured in the WordPress site settings.
	 */
	languageCode?: string;
};

const debug = debugFactory( 'jetpack-ai-client:ask-question' );

/**
 * An asynchronous function that asks a question
 * and returns an event source with suggestions.
 *
 * @param {PromptProp}                 question - The question to ask. It can be a simple string or an array of PromptMessageItemProps objects.
 * @param {AskQuestionOptionsArgProps} options  - An optional object for additional configuration:
 * @return {Promise<SuggestionsEventSource>}    A promise that resolves to an instance of the SuggestionsEventSource
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
	{
		postId = null,
		fromCache = false,
		feature,
		functions,
		model,
		languageCode,
	}: AskQuestionOptionsArgProps = {}
): Promise< SuggestionsEventSource > {
	const code =
		languageCode || select( 'core' ).getEntityRecord( 'root', 'site' )?.language || 'en_US';

	debug( 'Asking question: %o. options: %o', question, {
		postId,
		fromCache,
		feature,
		functions,
		model,
		languageCode: code,
	} );

	return new SuggestionsEventSource( {
		question,
		options: {
			postId,
			feature,
			fromCache,
			functions,
			model,
			languageCode: code,
		},
	} );
}
