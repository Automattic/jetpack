/**
 * External dependencies
 */
import { select } from '@wordpress/data';
import debugFactory from 'debug';
import { ToneProp } from '../../components/tone-dropdown-control';

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

type PromptItemProps = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

/*
 * Builds a prompt template based on context, rules and content
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
	context = 'You are an AI assistant, your task is to generate and modify content based on user requests. This functionality is integrated into the Jetpack product developed by Automattic. Users interact with you through a Gutenberg block, you are inside the Wordpress editor',
	rules = [],
	request = null,
	relevantContent = null,
	isContentGenerated = false,
	fullContent = null,
	isGeneratingTitle = false,
} ): Array< PromptItemProps > => {
	if ( ! request && ! relevantContent ) {
		throw new Error( 'You must provide either a request or content' );
	}

	const messages = [];

	const postTitle = select( 'core/editor' ).getEditedPostAttribute( 'title' ) || '';

	const blogPostData = `Here's the content in the editor that serves as context to the user request:
${ postTitle?.length ? `- Current title: ${ postTitle }\n` : '' }${
		fullContent ? `- Current content: ${ fullContent }` : ''
	}`;

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

	messages.push( { role: 'system', content: prompt } );

	if ( postTitle?.length || !! fullContent ) {
		messages.push( {
			role: 'user',
			content: blogPostData,
		} );
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
	prompt?: Array< PromptItemProps >;
	type: string;
	userPrompt?: string;
	isGeneratingTitle?: boolean;
	options: {
		contentType?: string;
		tone?: ToneProp;
		language?: string;
	};
};

/**
 * Builds a prompt based on the type of prompt.
 *
 * @param {BuildPromptOptions} options - The prompt options.
 * @returns {Array< PromptItemProps >} The prompt.
 * @throws {Error} If the type is not recognized.
 */
export function buildPrompt( {
	generatedContent,
	allPostContent,
	postContentAbove,
	currentPostTitle,
	options,
	prompt,
	type,
	userPrompt,
	isGeneratingTitle,
}: BuildPromptOptions ): Array< PromptItemProps > {
	const isGenerated = options?.contentType === 'generated';
	const reference = {
		content: isGeneratingTitle ? 'the title' : 'the content',
		generated: isGeneratingTitle ? 'the title' : 'your last answer',
	};

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
				relevantContent: postContentAbove,
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
				relevantContent: allPostContent,
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
				request: `Make ${ reference.generated } longer.`,
				fullContent: allPostContent,
				relevantContent: generatedContent,
				isContentGenerated: true,
				isGeneratingTitle,
			} );
			break;

		/*
		 * Make the content shorter.
		 */
		case 'makeShorter':
			prompt = buildPromptTemplate( {
				request: `Make ${ reference.generated } shorter.`,
				fullContent: allPostContent,
				relevantContent: generatedContent,
				isContentGenerated: true,
				isGeneratingTitle,
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
				request: `Rewrite ${ isGenerated ? reference.generated : reference.content } with a ${
					options.tone
				} tone.`,
				fullContent: allPostContent,
				relevantContent: isGenerated ? generatedContent : allPostContent,
				isContentGenerated: isGenerated,
				isGeneratingTitle,
			} );
			break;

		/*
		 * Summarize the content.
		 */
		case 'summarize':
			prompt = buildPromptTemplate( {
				request: `Summarize ${ isGenerated ? reference.generated : reference.content }.`,
				fullContent: allPostContent,
				relevantContent: isGenerated ? generatedContent : allPostContent,
				isContentGenerated: isGenerated,
			} );
			break;

		/**
		 * Change the language, based on options.language
		 */
		case 'changeLanguage':
			prompt = buildPromptTemplate( {
				request: `Translate ${
					isGenerated ? reference.generated : reference.content
				} to the following language: ${ options.language }.`,
				fullContent: allPostContent,
				relevantContent: isGenerated ? generatedContent : allPostContent,
				isContentGenerated: isGenerated,
				isGeneratingTitle,
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
				isContentGenerated: !! generatedContent?.length,
				isGeneratingTitle,
			} );
			break;

		default:
			prompt = buildPromptTemplate( {
				request: userPrompt,
				fullContent: allPostContent,
				relevantContent: generatedContent,
				isContentGenerated: true,
				isGeneratingTitle,
			} );
			break;
	}

	return prompt;
}
