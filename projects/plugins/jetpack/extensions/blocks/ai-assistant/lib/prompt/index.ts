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

type BuildPromptOptions = {
	generatedContent: string;
	allPostContent?: string;
	postContentAbove?: string;
	currentPostTitle?: string;
	type: PromptTypeProp;
	userPrompt?: string;
	promptType?: string;
	options: {
		contentType?: 'generated' | string;
		tone?: ToneProp;
		language?: string;
	};
};

type GetPromptOptionsProps = {
	content?: string;
	contentType?: 'generated' | string;
	tone?: ToneProp;
	language?: string;
};

type EditorStore = {
	getEditedPostAttribute: ( attribute: string ) => string;
};

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

/**
 * Helper function to get the initial system prompt.
 * It defines the `context` value in case it isn't provided.
 *
 * @param {object} options         - The options for the prompt.
 * @param {string} options.context - The context of the prompt.
 * @returns {PromptItemProps}      - The initial system prompt.
 */
export function getInitialSystemPrompt( {
	context = 'You are a ghostwriter. Your task is to generate and modify content based on user requests. This functionality is integrated into the Jetpack product developed by Automattic. Users interact with you through a Gutenberg block, you are inside the Wordpress editor',
}: {
	context?: string;
} = {} ): PromptItemProps {
	return { role: 'system', content: context };
}

/**
 * Helper function to get the rules user prompt.
 *
 * @param {object} options                - The options for the prompt.
 * @param {Array<string>} options.rules   - The rules to follow.
 * @param {boolean} options.isTitlePrompt - Whether the the prompt refers to a post title.
 * @returns {PromptItemProps}             - The rules user prompt.
 */
export function getRulesPrompt( {
	rules = [],
	isTitlePrompt = false,
}: {
	rules?: Array< string >;
	isTitlePrompt?: boolean;
} ): PromptItemProps {
	// Rules
	const promptRules = [
		...rules,
		'Execute the request without any acknowledgement of it, only outputting the final result',
		'Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent',
		'If you cannot generate a meaningful response to a user\'s request, reply with "__JETPACK_AI_ERROR__". This term should only be used in this context, it is used to generate user facing errors',
	];
	if ( ! isTitlePrompt ) {
		promptRules.push( 'Format your responses in Markdown syntax, ready to be published' );
	}

	let formattedRules = '';
	formattedRules = promptRules.map( rule => `- ${ rule }.` ).join( '\n' );

	const prompt = `Strictly follow these rules:
${ formattedRules }`;

	return { role: 'system', content: prompt };
}

/**
 * Helper function to get the blog post data prompt.
 *
 * @param {object} options         - The options for the prompt.
 * @param {string} options.content - The content of the post.
 * @returns {PromptItemProps}      - The blog post data prompt.
 */
export function getBlogPostDataUserPrompt( { content }: { content: string } ): PromptItemProps {
	const store = select( editorStore ) as EditorStore;
	const postTitle = store.getEditedPostAttribute( 'title' );

	if ( ! postTitle?.length && ! content?.length ) {
		return null;
	}

	const blogPostData = `Here's the content in the editor that serves as context to the user request:
${ postTitle?.length ? `- Current title: ${ postTitle }\n` : '' }${
		content ? `- Current content: ${ content }` : ''
	}`;

	return {
		role: 'system',
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
 * @param {boolean} options.isTitlePrompt      - Whether the the prompt refers to a post title.
 *
 * @return {Array<PromptItemProps>}
 */
export const buildPromptTemplate = ( {
	rules = [],
	request = null,
	relevantContent = null,
	isContentGenerated = false,
	fullContent = null,
	isTitlePrompt = false,
}: {
	rules?: Array< string >;
	request?: string;
	relevantContent?: string;
	isContentGenerated?: boolean;
	fullContent?: string;
	isTitlePrompt?: boolean;
} ): Array< PromptItemProps > => {
	if ( ! request && ! relevantContent ) {
		throw new Error( 'You must provide either a request or content' );
	}

	// Add initial system prompt.
	const messages = [ getInitialSystemPrompt() ];

	// Add blog post data prompt.
	const postDataPrompt = getBlogPostDataUserPrompt( { content: fullContent } );
	if ( postDataPrompt ) {
		messages.push( postDataPrompt );
	}

	if ( relevantContent != null && relevantContent?.length ) {
		if ( ! isContentGenerated ) {
			messages.push( {
				role: 'user',
				content: `The specific relevant content for this request, if necessary: ${ relevantContent }`,
			} );
		}
	}

	const lastUserRequest: PromptItemProps = {
		role: 'user',
		content: request,
	};

	// Add the rules
	messages.push( getRulesPrompt( { rules, isTitlePrompt } ) );

	messages.push( lastUserRequest );

	messages.forEach( message => {
		debug( `Role: ${ message?.role }.\nMessage: ${ message?.content }\n---` );
	} );

	return messages;
};

/**
 * Helper function to map each prompt type to a text and extra rules.
 *
 * @param {PromptTypeProp} type         - The type of the prompt.
 * @param {boolean} isTitlePrompt         - Whether the the prompt refers to a post title.
 * @param {GetPromptOptionsProps} options - The prompt options.
 * @returns {object}                      - The prompt text and rules.
 */
export function promptTextFor(
	type: PromptTypeProp,
	isTitlePrompt = false,
	options: GetPromptOptionsProps
): { request: string; rules?: string[] } {
	const isGenerated = options?.contentType === 'generated';
	let subject;
	if ( isGenerated ) {
		subject = isTitlePrompt ? 'the last title you generated' : 'your last answer';
	} else {
		subject = isTitlePrompt ? 'the title' : 'the content';
	}

	const rules = [];
	if ( isTitlePrompt ) {
		rules.push( 'Respond only with the raw generated title without quotation marks' );
		rules.push( 'Do not generate body content' );
	}

	switch ( type ) {
		case PROMPT_TYPE_SUMMARY_BY_TITLE:
			return { request: `Write a short piece for a blog post based on ${ subject }.`, rules };
		case PROMPT_TYPE_CONTINUE:
			return {
				request: `Continue writing from ${ subject }.`,
				rules: isGenerated
					? rules
					: [ ...rules, 'Only output the continuation of the content, without repeating it' ],
			};
		case PROMPT_TYPE_SIMPLIFY:
			return {
				request: `Simplify ${ subject }.`,
				rules: [
					...rules,
					'Use words and phrases that are easier to understand for non-technical people',
					'Output in the same language of the content',
					'Use as much of the original language as possible',
				],
			};
		case PROMPT_TYPE_CORRECT_SPELLING:
			return {
				request: `Repeat ${ subject }, correcting any spelling and grammar mistakes, and do not add new content.`,
				rules,
			};
		case PROMPT_TYPE_GENERATE_TITLE:
			return { request: 'Generate a new title for this blog post.', rules };
		case PROMPT_TYPE_MAKE_LONGER:
			return { request: `Make ${ subject } longer.`, rules };
		case PROMPT_TYPE_MAKE_SHORTER:
			return { request: `Make ${ subject } shorter.`, rules };
		case PROMPT_TYPE_CHANGE_TONE:
			return { request: `Rewrite ${ subject } with a ${ options.tone } tone.`, rules };
		case PROMPT_TYPE_SUMMARIZE:
			return { request: `Summarize ${ subject }.`, rules };
		case PROMPT_TYPE_CHANGE_LANGUAGE:
			return {
				request: `Translate ${ subject } to the following language: ${ options.language }.`,
				rules,
			};
		default:
			return null;
	}
}

/**
 * Builds a prompt based on the type of prompt.
 * Meant for use by the block, not the extensions.
 *
 * @param {BuildPromptOptions} options      - The prompt options.
 * @param {string} options.generatedContent - The generated content.
 * @param {string} options.allPostContent   - The full content of the post.
 * @param {string} options.postContentAbove - The content above the block.
 * @param {string} options.currentPostTitle - The current post title.
 * @param {PromptTypeProp} options.type     - The type of prompt.
 * @param {string} options.userPrompt       - The user prompt, if any.
 * @param {string} options.promptType       - The prompt type block attribute, if any. @todo revisit the attribute to avoid confusion with the type prop.
 * @returns {Array< PromptItemProps >}      - The prompt.
 * @throws {Error}                          - If the type is not recognized.
 */
export function buildPromptForBlock( {
	generatedContent,
	allPostContent,
	postContentAbove,
	currentPostTitle,
	options,
	type,
	userPrompt,
	promptType,
}: BuildPromptOptions ): Array< PromptItemProps > {
	const isContentGenerated = options?.contentType === 'generated';
	const isTitlePrompt = [ promptType, type ].includes( PROMPT_TYPE_GENERATE_TITLE );
	const promptText = promptTextFor( type, isTitlePrompt, options );

	if ( type !== PROMPT_TYPE_USER_PROMPT ) {
		let relevantContent: string;

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
			isTitlePrompt,
		} );
	}

	return buildPromptTemplate( {
		request: userPrompt,
		fullContent: allPostContent,
		relevantContent: generatedContent || allPostContent,
		isContentGenerated: !! generatedContent?.length,
		isTitlePrompt,
	} );
}

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
