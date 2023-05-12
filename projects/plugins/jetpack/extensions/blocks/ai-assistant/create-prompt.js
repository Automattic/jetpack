/**
 * External dependencies
 */
import debugFactory from 'debug';
import { defaultLanguage, defaultLocale } from './i18n-dropdown-control';

// Maximum number of characters we send from the content
export const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 1024;

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

/*
 * Builds a prompt template based on context, rules and content
 *
 * @param {object} options         - The prompt options.
 * @param {string} options.context - The expected context to the prompt, e.g. "You are...".
 * @param {array} options.rules    - An array of rules to be followed.
 * @param {string} options.request - The prompt request.
 * @param {string} options.content - The content to be modified.
 *
 * @return {string} The prompt.
 */
export const buildPromptTemplate = ( {
	context = 'You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic',
	rules = [],
	request = null,
	content = null,
	lang = defaultLanguage,
	locale = defaultLocale,
} ) => {
	if ( ! request && ! content ) {
		throw new Error( 'You must provide either a request or content' );
	}

	let langLocationRule = lang ? `- Write in the language: ${ lang }.` : '';
	langLocationRule = langLocationRule.length && locale ? ` locale: ${ locale }.` : langLocationRule;

	let job = 'Your job is to ';

	if ( !! request && ! content ) {
		job += 'respond to the request below, under "Request"';
	} else if ( ! request && !! content ) {
		job += 'modify the content below, under "Content"';
	} else {
		job +=
			'modify the content shared below, under "Content", based on the request below, under "Request"';
	}

	const requestText = ! request
		? ''
		: `\nRequest:
${ request }`;

	const contentText = ! content
		? ''
		: `\nContent:
${ content }`;

	const prompt = `${ context }.
${ job }. Do this by following rules set in "Rules".

Rules:
- Output the generated content in markdown format.
- Do not include a top level heading by default.
- Only output generated content ready for publishing.${ langLocationRule }${
		rules.length ? '\n' : ''
	}${ rules.map( rule => `- ${ rule }.` ).join( '\n' ) }
${ requestText }${ requestText && contentText ? `\n${ contentText }` : contentText }`;

	debug( prompt );
	return prompt;
};
