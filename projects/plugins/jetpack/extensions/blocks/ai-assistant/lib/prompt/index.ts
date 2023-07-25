/**
 * External dependencies
 */
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

export const delimiter = '````';

/**
 * Helper function to get the initial system prompt.
 * It defines the `context` value in case it isn't provided.
 *
 * @param {object} options - The options for the prompt.
 * @param {string} options.context - The context of the prompt.
 * @param {Array<string>} options.rules - The rules to follow.
 * @param {boolean} options.useGutenbergSyntax - Enable prompts focused on layout building.
 * @param {boolean} options.useMarkdown - Enable answer to be in markdown.
 * @param {string} options.customSystemPrompt - Provide a custom system prompt that will override system.
 * @returns {PromptItemProps} The initial system prompt.
 */
export function getInitialSystemPrompt( {
	context = 'You are an advanced polyglot ghostwriter. Your task is to generate and modify content based on user requests. This functionality is integrated into the Jetpack product developed by Automattic. Users interact with you through a Gutenberg block, you are inside the WordPress editor',
	rules,
	useGutenbergSyntax = false,
	useMarkdown = true,
	customSystemPrompt = null,
}: {
	context?: string;
	rules?: Array< string >;
	useGutenbergSyntax?: boolean;
	useMarkdown?: boolean;
	customSystemPrompt?: string;
} ): PromptItemProps {
	// Rules
	let extraRules = '';

	if ( rules?.length ) {
		extraRules = rules.map( rule => `- ${ rule }.` ).join( '\n' ) + '\n';
	}

	let prompt = `${ context }. Strictly follow these rules:

${ extraRules }${
		useMarkdown ? '- Format your responses in Markdown syntax, ready to be published.' : ''
	}
- Execute the request without any acknowledgement to the user.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user's request, reply with “__JETPACK_AI_ERROR__“. This term should only be used in this context, it is used to generate user facing errors.
`;

	// POC for layout prompts:
	if ( useGutenbergSyntax ) {
		context =
			'You are a ghostwriter that speaks only WordPress Gutenberg code. You are inside the WordPress editor in a functionality that is integrated into the Jetpack product developed by Automattic.';
		prompt = `${ context }. Strictly follow these rules:
	
${ extraRules }- Do not refer to yourself in your answers.
- The response should contain only Gutenberg block markup. No additional content should be present.
- Use only WordPress core blocks.
- If you cannot generate a meaningful response to a request, reply with "__JETPACK_AI_ERROR__". This term should only be used in this context, it is used to generate user facing errors.
- Do not wrap the response with any kind of delimiters.
- All blocks should contain a Gutenberg HTML comment with the block name, e.g. <!-- wp:paragraph -->.
- Code snippets should use a code block.
- For poetry or song lyrics, use a verse block
- Use https://source.unsplash.com/random/ for images with a random id parameter. When the image content is specified, add the search terms to the URL, e.g. https://source.unsplash.com/random/?cat&id=437 for a random image of a cat.
- For videos, use an empty video block.
- For forms, use Jetpack forms.
- Use the minimum amount of tokens possible.
- Remove HTML indentation, all new lines and unnecessary whitespace between tags and also with comments, using new lines and whitespace only for content inside tags. The response should use the least amount of lines possible, concatenating tags and comments in the same line.
Gutenberg blocks specific rules:
- Paragraph blocks (wp:paragraph) must always have some placeholder text if unspecified.
- Table blocks (wp:table) should have a <figure class="wp-block-table"> element wrapping the <table> element to avoid validation errors.
- Code blocks (wp:code) are a <code> element wrapped with a <pre class="wp-block-code"> element.
- Verse blocks (wp:verse) are a <pre class="wp-block-verse"> element.
- Gallery blocks (wp:gallery) only have a <figure class="wp-block-gallery has-nested-images"> element with additional classes and with Gutenberg image blocks inside it, including comments, and nothing else. Do not add <ul> or <li> elements inside the gallery block.
  - Example of a correct gallery block with two images of cats: <!-- wp:gallery --><figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":1} --><figure class="wp-block-image size-large"><img src="https://source.unsplash.com/random/?cat&id=1" alt="Image 1"/><figcaption class="wp-element-caption">Caption 1</figcaption></figure><!-- /wp:image --><!-- wp:image {"id":2 } --><figure class="wp-block-image size-large"><img src="https://source.unsplash.com/random/?cat&id=2" alt="Image 2"/><figcaption class="wp-element-caption">Caption 2</figcaption></figure><!-- /wp:image --></figure><!-- /wp:gallery -->
- Cover blocks (wp:cover) must always contain hidden span element as the first child of the wrapper div element and a paragraph block inside the inner container, even if empty. If unspecified, use a background image.
  - Example of a correct cover block with placeholder text: <!-- wp:cover {"overlayColor":"base"} --><div class="wp-block-cover"><span aria-hidden="true" class="wp-block-cover__background has-base-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","fontSize":"large"} --><p class="has-text-align-center has-large-font-size">Placeholder text</p><!-- /wp:paragraph --></div></div><!-- /wp:cover -->
  - Example of a correct cover block with placeholder text and an image background: <!-- wp:cover {"url":"https://source.unsplash.com/random/?id=231","id":1,"dimRatio":50,"isDark":false} --><div class="wp-block-cover is-light"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><img class="wp-block-cover__image-background wp-image-1" alt="Placeholder image" src="https://source.unsplash.com/random/?id=231" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","fontSize":"large"} --><p class="has-text-align-center has-large-font-size">Placeholder text</p><!-- /wp:paragraph --></div></div><!-- /wp:cover -->
- Jetpack forms (wp:jetpack/contact-form) can only contain the following blocks: wp:jetpack/field-text, wp:jetpack/field-name. wp:jetpack/field-email, wp:jetpack/field-select, wp:jetpack/field-radio, wp:jetpack/field-option-radio, wp:jetpack/field-checkbox-multiple, wp:jetpack/field-option-checkbox, wp:jetpack/field-consent, wp:jetpack/field-checkbox, wp:jetpack/field-textarea, wp:jetpack/field-telephone, wp:jetpack/field-date, wp:jetpack/field-url and wp:jetpack/button.
  - Example of a form with name, email and a submit button: <!-- wp:jetpack/contact-form {"subject":"My form submission","to":"myemail@example.com"} --><div class="wp-block-jetpack-contact-form"><!-- wp:jetpack/field-email {"required":true,"requiredText":"(required)","className":"wp-block-jetpack-field-email"} /--><!-- wp:jetpack/field-name {"required":true,"requiredText":"(required)","className":"wp-block-jetpack-field-name"} /--><!-- wp:jetpack/button {"element":"button","text":"Submit","lock":{"remove":true}} /--></div><!-- /wp:jetpack/contact-form -->
`;
	}

	if ( customSystemPrompt ) {
		prompt = customSystemPrompt;
	}

	return { role: 'system', content: prompt };
}

type PromptOptionsProps = {
	/*
	 * The content to add to the prompt.
	 */
	content: string;

	/*
	 * The language to translate to. Optional.
	 */
	language?: string;

	/*
	 * The tone to use. Optional.
	 */
	tone?: ToneProp;

	/*
	 * The role of the prompt. Optional.
	 */
	role?: PromptItemProps[ 'role' ];

	/*
	 * The previous messages of the same prompt. Optional.
	 */
	prevMessages?: Array< PromptItemProps >;
};

export function getDelimitedContent( content: string ): string {
	return `${ delimiter }${ content.replaceAll( delimiter, '' ) }${ delimiter }`;
}

function getCorrectSpellingPrompt( {
	content,
	role = 'user',
}: PromptOptionsProps ): Array< PromptItemProps > {
	return [
		{
			role,
			content: `Repeat the text delimited with ${ delimiter }, without the delimiter, correcting any spelling and grammar mistakes directly in the text without providing feedback about the corrections, keeping the language of the text: ${ getDelimitedContent(
				content
			) }`,
		},
	];
}

function getSimplifyPrompt( {
	content,
	role = 'user',
}: PromptOptionsProps ): Array< PromptItemProps > {
	return [
		{
			role,
			content: `Simplify the text delimited with ${ delimiter }, using words and phrases that are easier to understand and keeping the language of the text: ${ getDelimitedContent(
				content
			) }`,
		},
	];
}

function getSummarizePrompt( {
	content,
	role = 'user',
}: PromptOptionsProps ): Array< PromptItemProps > {
	return [
		{
			role,
			content: `Summarize the text delimited with ${ delimiter }, keeping the language of the text: ${ getDelimitedContent(
				content
			) }`,
		},
	];
}

function getExpandPrompt( {
	content,
	role = 'user',
}: PromptOptionsProps ): Array< PromptItemProps > {
	return [
		{
			role,
			content: `Expand the text delimited with ${ delimiter } to about double its size, keeping the language of the text: ${ getDelimitedContent(
				content
			) }`,
		},
	];
}

function getTranslatePrompt( {
	content,
	language,
	role = 'user',
}: PromptOptionsProps ): Array< PromptItemProps > {
	return [
		{
			role,
			content: `Translate the text delimited with ${ delimiter } to ${ language }, preserving the same core meaning and tone: ${ getDelimitedContent(
				content
			) }`,
		},
	];
}

function getTonePrompt( {
	content,
	tone,
	role = 'user',
}: PromptOptionsProps ): Array< PromptItemProps > {
	return [
		{
			role,
			content: `Rewrite the text delimited with ${ delimiter }, with a ${ tone } tone, keeping the language of the text: ${ getDelimitedContent(
				content
			) }`,
		},
	];
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
 * @param {boolean} options.isGeneratingTitle  - Whether the title is being generated or not.
 *
 * @return {Array<PromptItemProps>}
 */
export const buildPromptTemplate = ( {
	rules = [],
	request = null,
	relevantContent = null,
	isContentGenerated = false,
	isGeneratingTitle = false,
	useGutenbergSyntax = false,
	customSystemPrompt = null,
}: {
	rules?: Array< string >;
	request?: string;
	relevantContent?: string;
	isContentGenerated?: boolean;
	isGeneratingTitle?: boolean;
	useGutenbergSyntax?: boolean;
	customSystemPrompt?: string;
} ): Array< PromptItemProps > => {
	if ( ! request && ! relevantContent ) {
		throw new Error( 'You must provide either a request or content' );
	}

	// Add initial system prompt.
	const messages = [ getInitialSystemPrompt( { rules, useGutenbergSyntax, customSystemPrompt } ) ];

	if ( relevantContent != null && relevantContent?.length ) {
		const sanitizedContent = relevantContent.replaceAll( delimiter, '' );

		if ( ! isContentGenerated ) {
			messages.push( {
				role: 'user',
				content: `The specific relevant content for this request, if necessary, delimited with ${ delimiter } characters: ${ delimiter }${ sanitizedContent }${ delimiter }`,
			} );
		}
	}

	const lastUserRequest: PromptItemProps = {
		role: 'user',
		content: request,
	};

	if ( isGeneratingTitle ) {
		lastUserRequest.content += ' Only output a title, do not generate body content.';
	}

	messages.push( lastUserRequest );

	messages.forEach( message => {
		debug( `Role: ${ message?.role }.\nMessage: ${ message?.content }\n---` );
	} );

	return messages;
};

export type BuildPromptOptionsProps = {
	contentType?: 'generated' | string;
	tone?: ToneProp;
	language?: string;
};

type BuildPromptProps = {
	generatedContent: string;
	allPostContent?: string;
	postContentAbove?: string;
	currentPostTitle?: string;
	type: PromptTypeProp;
	userPrompt?: string;
	isGeneratingTitle?: boolean;
	useGutenbergSyntax?: boolean;
	customSystemPrompt?: string;
	options: BuildPromptOptionsProps;
};

type GetPromptOptionsProps = {
	content?: string;
	contentType?: 'generated' | string;
	tone?: ToneProp;
	language?: string;
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
 * @param {BuildPromptProps} options - The prompt options.
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
	useGutenbergSyntax,
	customSystemPrompt,
}: BuildPromptProps ): Array< PromptItemProps > {
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
			relevantContent,
			isContentGenerated,
			isGeneratingTitle,
			useGutenbergSyntax,
			customSystemPrompt,
		} );
	}

	return buildPromptTemplate( {
		request: userPrompt,
		relevantContent: generatedContent || allPostContent,
		isContentGenerated: !! generatedContent?.length,
		isGeneratingTitle,
		useGutenbergSyntax,
		customSystemPrompt,
	} );
}

/**
 * Returns a prompt based on the type and options
 *
 * @param {PromptTypeProp} type           - The type of prompt.
 * @param {GetPromptOptionsProps} options - The prompt options.
 * @returns {Array< PromptItemProps >}      The prompt.
 */
export function getPrompt(
	type: PromptTypeProp,
	options: PromptOptionsProps
): Array< PromptItemProps > {
	debug( 'Addressing prompt type: %o %o', type, options );
	const { prevMessages = [] } = options;

	const context =
		'You are an advanced polyglot ghostwriter.' +
		'Your task is to help the user create and modify content based on their requests.';

	const systemPrompt: PromptItemProps = {
		role: 'system',
		content: `${ context }
Writing rules:
- Execute the request without any acknowledgment or explanation to the user.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user’s request, reply with “__JETPACK_AI_ERROR__“. This term should only be used in this context, it is used to generate user facing errors.
`,
	};

	// Prompt starts with the previous messages, if any.
	const prompt: Array< PromptItemProps > = prevMessages;

	// Then, add the `system` prompt to clarify the context.
	prompt.push( systemPrompt );

	// Finally, add the current `user` request.
	switch ( type ) {
		case PROMPT_TYPE_CORRECT_SPELLING:
			return [ ...prompt, ...getCorrectSpellingPrompt( options ) ];

		case PROMPT_TYPE_SIMPLIFY:
			return [ ...prompt, ...getSimplifyPrompt( options ) ];

		case PROMPT_TYPE_SUMMARIZE:
			return [ ...prompt, ...getSummarizePrompt( options ) ];

		case PROMPT_TYPE_MAKE_LONGER:
			return [ ...prompt, ...getExpandPrompt( options ) ];

		case PROMPT_TYPE_CHANGE_LANGUAGE:
			return [ ...prompt, ...getTranslatePrompt( options ) ];

		case PROMPT_TYPE_CHANGE_TONE:
			return [ ...prompt, ...getTonePrompt( options ) ];

		default:
			throw new Error( `Unknown prompt type: ${ type }` );
	}

	return prompt;
}
