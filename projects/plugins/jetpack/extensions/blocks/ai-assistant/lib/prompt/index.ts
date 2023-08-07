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
- If you cannot generate a meaningful response to a user's request, reply with "__JETPACK_AI_ERROR__". This term should only be used in this context, it is used to generate user facing errors.
`;

	// POC for layout prompts:
	if ( useGutenbergSyntax ) {
		prompt = `${ context }. Strictly follow these rules:
	
${ extraRules }- Format your responses in Gutenberg HTML format including HTML comments for WordPress blocks. All responses must be valid Gutenberg HTML.
- Use only WordPress core blocks
- Execute the request without any acknowledgement to the user.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user's request, reply with "__JETPACK_AI_ERROR__". This term should only be used in this context, it is used to generate user facing errors.
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
			content: `You are an expert developer in Gutenberg, the WordPress block editor, and thoroughly familiar with the Jetpack Form feature. Your content will be used inside a Jetpack Form block that already exists.
Strictly follow those rules:
- Do not wrap the response in any block, element or any kind of delimiter.
- DO NOT add any addtional feedback to the "user", just generate the requested block structure.
- Do not refer to yourself, the user or the response in any way.
- When the user provides instructions, translate them into appropriate Gutenberg blocks and Jetpack form structure.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user's request, reply only with "__JETPACK_AI_ERROR__". This term should only be used in this context, it is used to generate user facing errors.`,
		},
		{
			role,
			content: `Handle the following request, delimited with ${ delimiter }: ${ getDelimitedContent(
				request
			) }

Strong requirements:
- When the user provides instructions, translate them into appropriate Gutenberg Jetpack form blocks in the allowed list.
- Do not wrap the generated structure with any block, element, or delimiters of any kind.
- Never use the wp:jetpack/contact-form block nor any containing elements. The existing form already has a containing block and appropriate elements.
- There is no wp:jetpack/form block. Never use it.
- When asked to add or modify something in the form, always respond with the full form with the modified or added part in it, not just the new part. This is to ensure no data is lost.
- Fill in the user's specification with the appropriate fields and options in the blocks.
- Always add, at the end, exactly one jetpack/button for the form submission. Forms require one button to be valid.
- Use only the allowed blocks with their allowed fields with the given syntax.
- If rounded corners are requested, use the same border radius for all fields and buttons and use a positive value.

- Fields list:
  label:
    type: string
    description: The label of the field.
  required:
    type: boolean
    description: Whether the field is required or not.
  requiredText:
    type: string
    description: The text to display when the field is required.
  placeholder:
    type: string
    description: The placeholder of the field.
  options:
    type: array[string]
    description: The options of the field.
  toggleLabel:
    type: string
    description: The label of the toggle.
  consentType:
    type: string
    description: The type of consent.
  implicitConsentMessage:
    type: string
    description: The implicit consent message.
  explicitConsentMessage:
    type: string
    description: The explicit consent message.
  borderRadius:
    type: number
    description: The border radius of the button or field.
  labelColor:
    type: string
    description: The color of the field label, in hex format.
  inputColor:
    type: string
    description: The color of the field input, in hex format.
  fieldBackgroundColor:
    type: string
    description: The color of the field background, in hex format.
  borderColor:
    type: string
    description: The color of the field border, in hex format.
  borderWidth:
    type: number
    description: The width of the field border.
  labelFontSize:
    type: string
    description: The font size of the field label including unit (px).
  fieldFontSize:
    type: string
    description: The font size of the field input including unit (px).
  lineHeight:
    type: number
    description: The line height of the field.
  labelLineHeight:
    type: number
    description: The line height of the field label.
  element:
    type: string
    description: The element of the button.
  text:
    type: string
    description: The text of the button.
  customTextColor:
    type: string
    description: The color of the button text.
  customBackgroundColor:
    type: string
    description: The color of the button background.

- Allowed blocks:
  Name Field
    code: wp:jetpack/field-name
    fields: label, required, requiredText, placeholder, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Email Field
    code: wp:jetpack/field-email
    fields: label, required, requiredText, placeholder, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Text Input Field
    code: wp:jetpack/field-text
    fields: label, required, requiredText, placeholder, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Multi-line Text Field
    code: wp:jetpack/field-textarea
    fields: label, required, requiredText, placeholder, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Checkbox
    code: wp:jetpack/field-checkbox
    fields: label, required, requiredText, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Date Picker
    code: wp:jetpack/field-date
    fields: label, required, requiredText, placeholder, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Phone Number Field
    code: wp:jetpack/field-telephone
    fields: label, required, requiredText, placeholder, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  URL Field
    code: wp:jetpack/field-url
    fields: label, required, requiredText, placeholder, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Multiple Choice (Checkbox)
    code: wp:jetpack/field-checkbox-multiple
    fields: label, required, requiredText, options, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Single Choice (Radio)
    code: wp:jetpack/field-radio
    fields: label, required, requiredText, options, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Dropdown Field
    code: wp:jetpack/field-select
    fields: label, required, requiredText, options, toggleLabel, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Terms Consent
    code: wp:jetpack/field-consent
    fields: consentType, implicitConsentMessage, explicitConsentMessage, borderRadius, labelColor, inputColor, fieldBackgroundColor, borderColor, borderWidth, labelFontSize, fieldFontSize, lineHeight, labelLineHeight
  Button
    code: wp:jetpack/button
    fields: label, element, text, borderRadius, labelColor, customTextColor, customBackgroundColor

- Syntax examples:
  Required name field with a border radius of 60px: <!-- wp:jetpack/field-name {"label":"Name","required":true,"requiredText":"(required)","placeholder":"Insert your name","borderRadius":56} /-->
  Optional email field with a pure red label: <!-- wp:jetpack/field-email {"label":"Email","placeholder":"Insert your email","labelColor":"#FF0000"} /-->
  Optional checkbox field with a pure blue 3px thick border with a field font size of 20px: <!-- wp:jetpack/field-checkbox {"label":"Include peppers","borderColor":"#0000FF","borderWidth":3 } /-->

Jetpack Form to modify or add content to, delimited with ${ delimiter }: ${ getDelimitedContent(
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

	const systemPrompt: PromptItemProps = {
		role: 'system',
		content: `You are an advanced polyglot ghostwriter. Your task is to help the user create and modify content based on their requests.
Writing rules:
- Execute the request without any acknowledgment or explanation to the user.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user's request, reply with "__JETPACK_AI_ERROR__". This term should only be used in this context, it is used to generate user facing errors.
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
