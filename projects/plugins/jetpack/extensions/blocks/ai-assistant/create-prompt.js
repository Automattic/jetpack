/**
 * External dependencies
 */
import debugFactory from 'debug';
import { LANGUAGE_MAP } from './i18n-dropdown-control';

// Maximum number of characters we send from the content
export const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 1024;

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

/*
 * Builds a prompt template based on context, rules and content
 *
 * @param {object} options          - The prompt options.
 * @param {string} options.context  - The expected context to the prompt, e.g. "You are...".
 * @param {array} options.rules     - An array of rules to be followed.
 * @param {string} options.request  - The prompt request.
 * @param {string} options.content  - The content to be modified.
 * @param {string} options.language - The language of the content.
 * @param {string} options.locale   - The locale of the content.
 *
 * @return {string} The prompt.
 */
export const buildPromptTemplate = ( {
	context = 'You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic',
	rules = [],
	request = null,
	content = null,
	language = null,
	locale = null,
} ) => {
	if ( ! request && ! content ) {
		throw new Error( 'You must provide either a request or content' );
	}

	// Language and Locale
	let langLocatePromptPart = language
		? `- Write in the language: ${ language }${
				LANGUAGE_MAP[ language ]?.label ? ` (${ LANGUAGE_MAP[ language ].label })` : ''
		  }.`
		: '';
	langLocatePromptPart += langLocatePromptPart.length && locale ? ` locale: ${ locale }.` : '';
	langLocatePromptPart += langLocatePromptPart.length ? '\n' : '';

	// Rules
	let extraRulePromptPart = '';
	if ( rules?.length ) {
		extraRulePromptPart = rules.map( rule => `- ${ rule }.` ).join( '\n' ) + '\n';
	}

	let job = 'Your job is to ';

	if ( !! request && ! content ) {
		job += 'respond to the request below, under "Request"';
	} else if ( ! request && !! content ) {
		job += 'modify the content below, under "Content"';
	} else {
		job +=
			'modify the content shared below, under "Content", based on the request below, under "Request"';
	}

	const requestPromptBlock = ! request
		? ''
		: `\nRequest:
${ request }`;

	const contentText = ! content
		? ''
		: `\nContent:
${ content }`;

	// Context content
	const contextPromptPart = requestPromptBlock && contentText ? `\n${ contentText }` : contentText;

	const prompt =
		`${ context }.
${ job }. Do this by following rules set in "Rules".

-------------
Rules:
- If you do not understand the "Request" or the "Content", or if you think it is incomplete, regardless of language or any other rule, always answer exactly and without any preceding content with the following term and nothing else: __JETPACK_AI_ERROR__.
${ extraRulePromptPart }- Do not include a top level heading by default.
- Only output generated content ready for publishing.
- Segment the content into paragraphs as deemed suitable.
` +
		langLocatePromptPart +
		`-----------
		` +
		requestPromptBlock +
		contextPromptPart +
		`
-----------`;

	debug( prompt );
	return prompt;
};

export function buildPrompt( {
	generatedContent,
	allPostContent,
	postContentAbove,
	currentPostTitle,
	options,
	prompt,
	type,
	userPrompt,
} ) {
	switch ( type ) {
		/*
		 * Non-interactive types
		 */

		/*
		 * Generate content from title.
		 */
		case 'titleSummary':
			prompt = buildPromptTemplate( {
				request: 'Please help me write a short piece for a blog post based on the content below',
				content: currentPostTitle,
			} );
			break;

		/*
		 * Continue generating from the content below.
		 */
		case 'continue':
			prompt = buildPromptTemplate( {
				request: 'Please continue writing from the content below.',
				rules: [ 'Only output the continuation of the content, without repeating it' ],
				content: postContentAbove,
			} );
			break;

		/*
		 * Simplify the content.
		 */
		case 'simplify':
			prompt = buildPromptTemplate( {
				request: 'Simplify the content below.',
				rules: [
					'Use words and phrases that are easier to understand for non-technical people',
					'Output in the same language of the content',
					'Use as much of the original language as possible',
				],
				content: postContentAbove,
			} );
			break;

		/*
		 * Interactive only types
		 */

		/*
		 * Change the tone of the content.
		 */
		case 'changeTone':
			prompt = buildPromptTemplate( {
				request: `Please, rewrite with a ${ options.tone } tone.`,
				content: generatedContent,
			} );
			break;

		/*
		 * Make the content longer.
		 */
		case 'makeLonger':
			prompt = buildPromptTemplate( {
				request: 'Make the content below longer.',
				content: generatedContent,
			} );
			break;

		/*
		 * Make the content shorter.
		 */
		case 'makeShorter':
			prompt = buildPromptTemplate( {
				request: 'Make the content below shorter.',
				content: generatedContent,
			} );
			break;

		/*
		 * Types that can be interactive or non-interactive
		 */

		/*
		 * Summarize the content.
		 */
		case 'summarize':
			prompt = buildPromptTemplate( {
				request: 'Summarize the content below.',
				content: options.contentType === 'generated' ? generatedContent : allPostContent,
			} );
			break;

		/**
		 * Correct grammar and spelling
		 */
		case 'correctSpelling':
			prompt = buildPromptTemplate( {
				request: 'Correct any spelling and grammar mistakes from the content below.',
				content: options.contentType === 'generated' ? generatedContent : postContentAbove,
			} );
			break;

		/*
		 * Generate a title for this blog post, based on the content.
		 */
		case 'generateTitle':
			prompt = buildPromptTemplate( {
				request: 'Generate a title for this blog post',
				rules: [ 'Only output the raw title, without any prefix or quotes' ],
				content: options.contentType === 'generated' ? generatedContent : allPostContent,
			} );
			break;

		/**
		 * Change the language, based on options.language
		 */
		case 'changeLanguage':
			prompt = buildPromptTemplate( {
				request: `Please, rewrite the content below in the following language: ${ options.language }.`,
				content: options.contentType === 'generated' ? generatedContent : allPostContent,
			} );
			break;

		default:
			prompt = buildPromptTemplate( {
				request: userPrompt,
				content: generatedContent,
			} );
			break;
	}
	return prompt;
}
