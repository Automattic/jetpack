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
export const PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT = 'jetpackFormCustomPrompt' as const;

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
	PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT,
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
		prompt = `${ context }. Strictly follow these rules:
	
${ extraRules }- Format your responses in Gutenberg HTML format including HTML comments for WordPress blocks. All responses must be valid Gutenberg HTML.
- Use only WordPress core blocks
- Execute the request without any acknowledgement to the user.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user's request, reply with “__JETPACK_AI_ERROR__“. This term should only be used in this context, it is used to generate user facing errors.
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

	/*
	 * A custom request prompt. Optional.
	 */
	request?: string;
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

function getJetpackFormCustomPrompt( {
	content,
	role = 'user',
	request,
}: PromptOptionsProps ): Array< PromptItemProps > {
	if ( ! request ) {
		throw new Error( 'You must provide a custom prompt for the Jetpack Form Custom Prompt' );
	}

	return [
		{
			role: 'system',
			content: `You are an expert developer in Gutenberg, the WordPress block editor, and thoroughly familiar with the Jetpack Form feature.
Strictly follow those rules:
- Do not wrap the response in any block, element or any kind of delimiter.
- DO NOT add any additional feedback to the "user", just generate the requested block structure.
- Do not refer to yourself, the user or the response in any way.
- When the user provides instructions, translate them into appropriate Gutenberg blocks and Jetpack form structure.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user's request, reply only with "__JETPACK_AI_ERROR__". This term should only be used in this context, it is used to generate user facing errors.`,
		},
		{
			role,
			content: `Handle the following request: ${ request }

Strong requirements:
- Do not wrap the generated structure with any block, like the \`<!-- wp:jetpack/contact-form -->\` syntax.
- Always add, at the end, exactly one jetpack/button for the form submission. Forms require one button to be valid.
- Replace placeholders (like FIELD_LABEL, IS_REQUIRED, etc.) with the user's specifications.
- Use syntax templates for blocks as follows:
	- \`Name Field\`: <!-- wp:jetpack/field-name {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT,"placeholder":PLACEHOLDER_TEXT} /-->
	- \`Email Field\`: <!-- wp:jetpack/field-email {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT,"placeholder":PLACEHOLDER_TEXT} /-->
	- \`Text Input Field\`: <!-- wp:jetpack/field-text {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT,"placeholder":PLACEHOLDER_TEXT} /-->
	- \`Multi-line Text Field \`: <!-- wp:jetpack/field-textarea {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT,"placeholder":PLACEHOLDER_TEXT} /-->
	- \`Checkbox\`: <!-- wp:jetpack/field-checkbox {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT} /-->
	- \`Date Picker\`: <!-- wp:jetpack/field-date {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT,"placeholder":PLACEHOLDER_TEXT} /-->
	- \`Phone Number Field\`: <!-- wp:jetpack/field-telephone {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT,"placeholder":PLACEHOLDER_TEXT} /-->
	- \`URL Field\`: <!-- wp:jetpack/field-url {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT,"placeholder":PLACEHOLDER_TEXT} /-->
	- \`Multiple Choice (Checkbox)\`: <!-- wp:jetpack/field-checkbox-multiple {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT, "options": [OPTION_ONE, OPTION_TWO, OPTION_THREE]} /-->
	- \`Single Choice (Radio)\`: <!-- wp:jetpack/field-radio {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT, "options": [OPTION_ONE, OPTION_TWO, OPTION_THREE]} /-->
	- \`Dropdown Field\`: <!-- wp:jetpack/field-select {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT, "options": [OPTION_ONE, OPTION_TWO, OPTION_THREE],"toggleLabel":TOGGLE_LABEL} /-->
	- \`Terms Consent\`:  <!-- wp:jetpack/field-consent {"consentType":"CONSENT_TYPE","implicitConsentMessage":"IMPLICIT_CONSENT_MESSAGE","explicitConsentMessage":"EXPLICIT_CONSENT_MESSAGE", /-->
	- \`Button\`: <!-- wp:jetpack/button {"label":FIELD_LABEL,"element":"button","text":BUTTON_TEXT,"borderRadius":BORDER_RADIUS,"lock":{"remove":true}} /-->

- When a column layout is requested, add "width" attribute with value 25 (4 columns), 50 (2 columns) or 100 (force single column), like so: \`Name Field\`:
	- <!-- wp:jetpack/field-name {"label":FIELD_LABEL,"required":IS_REQUIRED,"requiredText":REQUIRED_TEXT,"placeholder":PLACEHOLDER_TEXT, "width":25} /-->
Jetpack Form to modify:\n${ content }`,
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

	const systemPrompt: PromptItemProps = {
		role: 'system',
		content: `You are an advanced polyglot ghostwriter. Your task is to help the user create and modify content based on their requests.
Writing rules:
- Execute the request without any acknowledgment or explanation to the user.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user's request, reply with “__JETPACK_AI_ERROR__“. This term should only be used in this context, it is used to generate user facing errors.
`,
	};

	// Prompt starts with the previous messages, if any.
	const prompt: Array< PromptItemProps > = [ ...prevMessages ];

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

		case PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT:
			// Does not use the default system prompt.
			return [ ...prevMessages, ...getJetpackFormCustomPrompt( options ) ];

		default:
			throw new Error( `Unknown prompt type: ${ type }` );
	}
}
