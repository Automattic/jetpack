/**
 * External dependencies
 */
import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { ToneProp } from '../../components/tone-dropdown-control';
/**
 * Types & consts
 */
export const PROMPT_TYPE_SUMMARY_BY_TITLE = 'titleSummary' as const;
export const PROMPT_TYPE_CONTINUE = 'continue' as const;
export const PROMPT_TYPE_SIMPLIFY = 'simplify' as const;
export const PROMPT_TYPE_CORRECT_SPELLING = 'correctSpelling' as const;
export const PROMPT_TYPE_GENERATE_TITLE = 'generateTitle' as const;
export const PROMPT_TYPE_MAKE_LONGER = 'makeLonger' as const;
export const PROMPT_TYPE_MAKE_SHORTER = 'makeShorter' as const;
export const PROMPT_TYPE_CHANGE_TONE = 'changeTone' as const;
export const PROMPT_TYPE_SUMMARIZE = 'summarize' as const;
export const PROMPT_TYPE_CHANGE_LANGUAGE = 'changeLanguage' as const;
export const PROMPT_TYPE_USER_PROMPT = 'userPrompt' as const;

export const PROMPT_TYPE_LIST = [
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
] as const;

export type PromptTypeProp = ( typeof PROMPT_TYPE_LIST )[ number ];

export type PromptItemProps = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

/**
 * Helper function to get the initial system prompt.
 * It defines the `context` value in case it isn't provided.
 *
 * @param {object} options - The options for the prompt.
 * @param {string} options.context - The context of the prompt.
 * @param {Array<string>} options.rules - The rules to follow.
 * @returns {PromptItemProps} The initial system prompt.
 */
export function getInitialSystemPrompt( {
	context = 'You are an AI assistant, your task is to generate and modify content based on user requests. This functionality is integrated into the Jetpack product developed by Automattic. Users interact with you through a Gutenberg block, you are inside the Wordpress editor',
	rules,
}: {
	context?: string;
	rules?: Array< string >;
} ): PromptItemProps {
	// Rules
	let extraRules = '';
	if ( rules?.length ) {
		extraRules = rules.map( rule => `- ${ rule }.` ).join( '\n' ) + '\n';
	}
	const prompt = `${ context }.
Strictly follow these rules:

${ extraRules }- Format your responses in Markdown syntax, ready to be published.
- Execute the request without any acknowledgement to the user.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user’s request, reply with “__JETPACK_AI_ERROR__“. This term should only be used in this context, it is used to generate user facing errors.
`;

	return { role: 'system', content: prompt };
}

/**
 * Helper function to get the blog post data prompt.
 *
 * @param {object} options         - The options for the prompt.
 * @param {string} options.content - The content of the post.
 * @returns {PromptItemProps} The blog post data prompt.
 */
export function getBlogPostDataPrompt( { content }: { content: string } ): PromptItemProps {
	const postTitle = select( editorStore ).getEditedPostAttribute( 'title' );

	if ( ! postTitle?.length && ! content?.length ) {
		return null;
	}

	const blogPostData = `Here's the content in the editor that serves as context to the user request:
${ postTitle?.length ? `- Current title: ${ postTitle }\n` : '' }${
		content ? `- Current content: ${ content }` : ''
	}`;

	return {
		role: 'user',
		content: blogPostData,
	};
}

/*
 * Builds a prompt template based on context, rules and content.
 *
 * By default, the first item of the prompt arrays is `system` role,
 * which provides the context and rules to the user.
 *
 * The last item of the prompt arrays is `user` role,
 * which provides the user request.
 *
 * @param {object} options                     - The prompt options.
 * @param {string} options.context             - The expected context to the prompt, e.g. "You are...".
 * @param {Array<string>} options.rules        - The rules to follow.
 * @param {string} options.request             - The request to the AI assistant.
 * @param {string} options.relevantContent     - The relevant content to the request.
 * @param {boolean} options.isContentGenerated - Whether the content is generated or not.
 * @param {string} options.fullContent         - The full content of the post.
 * @param {boolean} options.isGeneratingTitle  - Whether the title is being generated or not.
 *
 * @return {Array<PromptItemProps>}
 */
export const buildPromptTemplate = ( {
	rules = [],
	request = null,
	relevantContent = null,
	isContentGenerated = false,
	fullContent = null,
	isGeneratingTitle = false,
}: {
	rules?: Array< string >;
	request?: string;
	relevantContent?: string;
	isContentGenerated?: boolean;
	fullContent?: string;
	isGeneratingTitle?: boolean;
} ): Array< PromptItemProps > => {
	if ( ! request && ! relevantContent ) {
		throw new Error( 'You must provide either a request or content' );
	}

	// Add initial system prompt.
	const messages = [ getInitialSystemPrompt( { rules } ) ];

	// Add blog post data prompt.
	const postDataPrompt = getBlogPostDataPrompt( { content: fullContent } );
	if ( postDataPrompt ) {
		messages.push( postDataPrompt );
	}

	if ( relevantContent != null && relevantContent?.length ) {
		if ( isContentGenerated ) {
			messages.push( {
				role: 'assistant',
				content: relevantContent,
			} );
		} else {
			messages.push( {
				role: 'system',
				content: `The specific relevant content for this request, if necessary: ${ relevantContent }`,
			} );
		}
	}

	messages.push( {
		role: 'user',
		content: request,
	} );

	if ( isGeneratingTitle ) {
		messages.push( {
			role: 'user',
			content: 'Only output a title, do not generate body content.',
		} );
	}

	messages.forEach( message => {
		debug( `Role: ${ message?.role }.\nMessage: ${ message?.content }\n---` );
	} );

	return messages;
};

type BuildPromptOptions = {
	generatedContent: string;
	allPostContent?: string;
	postContentAbove?: string;
	currentPostTitle?: string;
	type: PromptTypeProp;
	userPrompt?: string;
	isGeneratingTitle?: boolean;
	options: {
		contentType?: 'generated' | string;
		tone?: ToneProp;
		language?: string;
	};
};

export function promptTextFor(
	type: PromptTypeProp,
	isGeneratingTitle = false,
	options: GetPromptOptionsProps
): { request: string; rules?: string[] } {
	const isGenerated = options?.contentType === 'generated';
	let subject = 'the title';
	if ( ! isGeneratingTitle ) {
		subject = isGenerated ? 'your last answer' : 'the content';
	}

	switch ( type ) {
		case PROMPT_TYPE_SUMMARY_BY_TITLE:
			return { request: `Write a short piece for a blog post based on ${ subject }.` };
		case PROMPT_TYPE_CONTINUE:
			return {
				request: `Continue writing from ${ subject }.`,
				rules: isGenerated
					? []
					: [ 'Only output the continuation of the content, without repeating it' ],
			};
		case PROMPT_TYPE_SIMPLIFY:
			return {
				request: `Simplify ${ subject }.`,
				rules: [
					'Use words and phrases that are easier to understand for non-technical people',
					'Output in the same language of the content',
					'Use as much of the original language as possible',
				],
			};
		case PROMPT_TYPE_CORRECT_SPELLING:
			return {
				request: `Repeat ${ subject }, correcting any spelling and grammar mistakes, and do not add new content.`,
			};
		case PROMPT_TYPE_GENERATE_TITLE:
			return {
				request: 'Generate a new title for this blog post and only output the title.',
				rules: [ 'Only output the raw title, without any prefix or quotes' ],
			};
		case PROMPT_TYPE_MAKE_LONGER:
			return { request: `Make ${ subject } longer.` };
		case PROMPT_TYPE_MAKE_SHORTER:
			return { request: `Make ${ subject } shorter.` };
		case PROMPT_TYPE_CHANGE_TONE:
			return { request: `Rewrite ${ subject } with a ${ options.tone } tone.` };
		case PROMPT_TYPE_SUMMARIZE:
			return { request: `Summarize ${ subject }.` };
		case PROMPT_TYPE_CHANGE_LANGUAGE:
			return {
				request: `Translate ${ subject } to the following language: ${ options.language }.`,
			};
		default:
			return null;
	}
}

/**
 * Builds a prompt based on the type of prompt.
 * Meant for use by the block, not the extensions.
 *
 * @param {BuildPromptOptions} options - The prompt options.
 * @returns {Array< PromptItemProps >} The prompt.
 * @throws {Error} If the type is not recognized.
 */
export function buildPromptForBlock( {
	generatedContent,
	allPostContent,
	postContentAbove,
	currentPostTitle,
	options,
	type,
	userPrompt,
	isGeneratingTitle,
}: BuildPromptOptions ): Array< PromptItemProps > {
	const isContentGenerated = options?.contentType === 'generated';
	const promptText = promptTextFor( type, isGeneratingTitle, options );

	if ( type !== PROMPT_TYPE_USER_PROMPT ) {
		let relevantContent;

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
		}

		return buildPromptTemplate( {
			...promptText,
			fullContent: allPostContent,
			relevantContent,
			isContentGenerated,
			isGeneratingTitle,
		} );
	}

	return buildPromptTemplate( {
		request: userPrompt,
		fullContent: allPostContent,
		relevantContent: generatedContent || allPostContent,
		isContentGenerated: !! generatedContent?.length,
		isGeneratingTitle,
	} );
}

type GetPromptOptionsProps = {
	content?: string;
	contentType?: 'generated' | string;
	tone?: ToneProp;
	language?: string;
};

/**
 * Returns a prompt based on the type and options
 *
 * @param {PromptTypeProp} type           - The type of prompt.
 * @param {GetPromptOptionsProps} options - The prompt options.
 * @returns {Array< PromptItemProps >}      The prompt.
 */
export function buildPromptForExtensions(
	type: PromptTypeProp,
	options: GetPromptOptionsProps
): Array< PromptItemProps > {
	const promptText = promptTextFor( type, false, options );

	return buildPromptTemplate( {
		...promptText,
		fullContent: options.content,
		relevantContent: options.content,
		isContentGenerated: false,
	} );
}
