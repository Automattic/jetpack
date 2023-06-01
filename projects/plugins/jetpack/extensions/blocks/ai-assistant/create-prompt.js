/**
 * External dependencies
 */
import { select } from '@wordpress/data';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { LANGUAGE_MAP } from './i18n-dropdown-control';

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
 * @return {array} The prompt.
 */
export const buildPromptTemplate = ( {
	context = 'You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic',
	rules = [],
	request = null,
	relevantContent = null,
	fullContent = null,
	language = null,
	locale = null,
	includeLanguageRule = true,
} ) => {
	if ( ! request && ! relevantContent ) {
		throw new Error( 'You must provide either a request or content' );
	}

	const messages = [];

	const postTitle = select( 'core/editor' ).getEditedPostAttribute( 'title' );

	const blogPostData = `Blog post data, for general context and reference:
${ postTitle.length ? `- Current title: ${ postTitle }\n` : '' }${
		fullContent ? `- Current content: ${ fullContent }` : ''
	}`;

	// Language and Locale
	let languageRule = language
		? `Write in the language: ${ language }${
				LANGUAGE_MAP[ language ]?.label ? ` (${ LANGUAGE_MAP[ language ].label })` : ''
		  }`
		: '';
	if ( ! languageRule.length && includeLanguageRule ) {
		languageRule = 'Write in the same language as the context, if provided and necessary';
	}
	languageRule += languageRule.length && locale ? ` locale: ${ locale }.` : '';
	languageRule += languageRule.length ? '\n' : '';

	// Rules
	let extraRules = '';
	if ( rules?.length ) {
		extraRules = rules.map( rule => `- ${ rule }.` ).join( '\n' ) + '\n';
	}

	const prompt = `${ context }.
Your job is to respond to the request from the user messages. Do this by strictly following those rules:

${ extraRules }- If you do not understand this request, regardless of language or any other rule, always answer exactly and without any preceding content with the following term and nothing else: __JETPACK_AI_ERROR__
- Do not use the term __JETPACK_AI_ERROR__ in any other context than the one described above
- Output the generated content in markdown format
- Do not include a top level heading by default
- Only output generated content ready for publishing
- Segment the content into paragraphs as deemed suitable
- Do not output any content that is not generated
- Do not mention what you are going to do, only do it
`;

	messages.push( { role: 'system', content: prompt } );

	if ( postTitle.length || !! fullContent ) {
		messages.push( {
			role: 'system',
			content: blogPostData,
		} );
	}

	messages.push( {
		role: 'system',
		content: `The specific relevant content for this request, if necessary: ${ relevantContent }`,
	} );

	messages.push( {
		role: 'user',
		content: request,
	} );

	if ( languageRule.length ) {
		messages.push( { role: 'user', content: languageRule } );
	}

	messages.forEach( message => {
		debug( `Role: ${ message.role }.\nMessage: ${ message.content }\n---` );
	} );
	return messages;
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
				request: 'Write a short piece for a blog post based on the content.',
				fullContent: allPostContent,
				relevantContent: currentPostTitle,
			} );
			break;

		/*
		 * Continue generating from the content.
		 */
		case 'continue':
			prompt = buildPromptTemplate( {
				request: 'Continue writing from the content.',
				rules: [ 'Only output the continuation of the content, without repeating it' ],
				fullContent: allPostContent,
				relevantContent: postContentAbove,
			} );
			break;

		/*
		 * Simplify the content.
		 */
		case 'simplify':
			prompt = buildPromptTemplate( {
				request: 'Simplify the content.',
				rules: [
					'Use words and phrases that are easier to understand for non-technical people',
					'Output in the same language of the content',
					'Use as much of the original language as possible',
				],
				fullContent: allPostContent,
				relevantContent: postContentAbove,
				includeLanguageRule: false,
			} );
			break;

		/*
		 * Interactive only types
		 */

		/*
		 * Make the content longer.
		 */
		case 'makeLonger':
			prompt = buildPromptTemplate( {
				request: 'Make the content longer.',
				fullContent: allPostContent,
				relevantContent: generatedContent,
			} );
			break;

		/*
		 * Make the content shorter.
		 */
		case 'makeShorter':
			prompt = buildPromptTemplate( {
				request: 'Make the content shorter.',
				fullContent: allPostContent,
				relevantContent: generatedContent,
			} );
			break;

		/*
		 * Types that can be interactive or non-interactive
		 */

		/*
		 * Change the tone of the content.
		 */
		case 'changeTone':
			prompt = buildPromptTemplate( {
				request: `Rewrite the content with a ${ options.tone } tone.`,
				fullContent: allPostContent,
				relevantContent: options.contentType === 'generated' ? generatedContent : allPostContent,
			} );
			break;

		/*
		 * Summarize the content.
		 */
		case 'summarize':
			prompt = buildPromptTemplate( {
				request: 'Summarize the content.',
				fullContent: allPostContent,
				relevantContent: options.contentType === 'generated' ? generatedContent : allPostContent,
			} );
			break;

		/**
		 * Correct grammar and spelling
		 */
		case 'correctSpelling':
			prompt = buildPromptTemplate( {
				request:
					'Repeat the content, correcting any spelling and grammar mistakes, and do not add new content.',
				fullContent: allPostContent,
				relevantContent: options.contentType === 'generated' ? generatedContent : postContentAbove,
			} );
			break;

		/*
		 * Generate a title for this blog post, based on the content.
		 */
		case 'generateTitle':
			prompt = buildPromptTemplate( {
				request: 'Generate a new title for this blog post and only output the title.',
				rules: [ 'Only output the raw title, without any prefix or quotes' ],
				fullContent: allPostContent,
				relevantContent: options.contentType === 'generated' ? generatedContent : allPostContent,
			} );
			break;

		/**
		 * Change the language, based on options.language
		 */
		case 'changeLanguage':
			prompt = buildPromptTemplate( {
				request: `Translate the content to the following language: ${ options.language }.`,
				fullContent: allPostContent,
				relevantContent: options.contentType === 'generated' ? generatedContent : allPostContent,
				includeLanguageRule: false,
			} );
			break;

		/**
		 * Open ended prompt from user
		 */
		case 'userPrompt':
			prompt = buildPromptTemplate( {
				request: userPrompt,
				fullContent: allPostContent,
				relevantContent: generatedContent || allPostContent,
			} );
			break;

		default:
			prompt = buildPromptTemplate( {
				request: userPrompt,
				fullContent: allPostContent,
				relevantContent: generatedContent,
			} );
			break;
	}
	return prompt;
}
