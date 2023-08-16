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
export const PROMPT_TYPE_GUTENBERG_SYNTAX_PROMPT = 'jetpackFormCustomPrompt' as const;

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
	PROMPT_TYPE_GUTENBERG_SYNTAX_PROMPT,
] as const;

export type PromptTypeProp = ( typeof PROMPT_TYPE_LIST )[ number ];

export type PromptItemProps = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

const debug = debugFactory( 'jetpack-ai-assistant:prompt' );

export const delimiter = '````';

export const compressSerializedBlockComposition = block => {
	const tagReplacements = {
		'<!-- wp:jetpack/contact-form': '<!-- ¢',
		'<!-- wp:jetpack/field-text': '<!-- £',
		'<!-- wp:jetpack/field-name': '<!-- ¥',
		'<!-- wp:jetpack/field-email': '<!-- €',
		'<!-- wp:jetpack/field-url': '<!-- §',
		'<!-- wp:jetpack/field-date': '<!-- ¶',
		'<!-- wp:jetpack/field-telephone': '<!-- ¤',
		'<!-- wp:jetpack/field-textarea': '<!-- ¦',
		'<!-- wp:jetpack/field-checkbox': '<!-- ³',
		'<!-- wp:jetpack/field-consent': '<!-- ¨',
		'<!-- wp:jetpack/field-radio': '<!-- ´',
		'<!-- wp:jetpack/field-option-radio': '<!-- ª',
		'<!-- wp:jetpack/field-select': '<!-- «',
		'<!-- wp:jetpack/button': '<!-- ¬',
		'<!-- /wp:jetpack/contact-form': '<!-- °',
		'<!-- /wp:jetpack/field-radio': '<!-- ²',
	};

	const keyReplacements = {
		'"subject"': '"¢"',
		'"to"': '"£"',
		'"style"': '"¥"',
		'"spacing"': '"€"',
		'"padding"': '"§"',
		'"top"': '"¶"',
		'"right"': '"¤"',
		'"bottom"': '"¦"',
		'"left"': '"³"',
		'"required"': '"¨"',
		'"requiredText"': '"´"',
		'"label"': '"ª"',
		'"element"': '"«"',
		'"text"': '"¬"',
		'"lock"': '"°"',
		'"remove"': '"²"',
		'"toggleLabel"': '"»"',
	};

	let compressedBlock = block;
	for ( const original in tagReplacements ) {
		const replacement = tagReplacements[ original ];
		compressedBlock = compressedBlock.split( original ).join( replacement );
	}
	for ( const original in keyReplacements ) {
		const replacement = keyReplacements[ original ];
		compressedBlock = compressedBlock.split( original ).join( replacement );
	}

	return compressedBlock;
};

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
- DO NOT add any addtional feedback to the "user", just generate the requested block structure.
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

function getGuenbergSyntaxCompositionPrompt( {
	content, // eslint-disable-line @typescript-eslint/no-unused-vars
	role = 'user',
	request,
}: PromptOptionsProps ): Array< PromptItemProps > {
	if ( ! request ) {
		throw new Error( 'You must provide a request' );
	}

	return [
		{
			role: 'system',
			content: `
			You are an advanced polyglot ghostwriter. Your task is to generate content based on user requests.
Also, You are an expert developer in Gutenberg, the WordPress block editor.

Strictly follow those rules:
- DO NOT add line breaks: \\n or \\r, etc.
- DO NOT add any addtional feedback to the "user", just generate the requested block structure.
- Avoid sensitive or controversial topics and ensure your responses are grammatically correct and coherent.
- If you cannot generate a meaningful response to a user's request, reply only with "__JETPACK_AI_ERROR__". This term should only be used in this context, it is used to generate user facing errors.`,
		},
		{
			role,
			content: `Please help me to create a content for my WordPress site post.

Follow these composing rules to be used in the Gutenberg editor (aka WordPress block editor):

# Simple blocks - Use these blocks for a simple composition:
- Paragraph: [ "core/paragraph",{ "content": CONTENT, "fontSize": FONT_SIZE }, ],
- Heading: [ "core/heading",{ "content": CONTENT, level: LEVEL, "textTransform":"uppercase"| "lowercase" | "capitalize", fontSize: FONT_SIZE, }, ],
- Image: [ "core/image", { "url": IMAGE_URL, alt: ALT, "className": "is-style-rounded" | "is-style-default" }, ],
- Button: [ "core/button", { "text": TEXT, "url": URL, "backgroundColor", BGCOLOR, "borderRadius": BORDER_RADIUS, "fontSize" }, ],
- Separator: [ "core/separator", { "opacity": OPACITY, "backgroundColor": BGCOLOR, "textColor": COLOR, }, ],

# Layout composition, based on "core/group" block. NEVER combine with "core/column" or "core/column" blocks. Nest Group-Row/Stack blocks to create complex layouts. Layout rules are based on the flexbox model.
- Column: Horizontal layout,  (DO NOT Change the attributes here ) [ "core/group", { "aling": wide, "layout": { "type":"flex", "flexWrap": "nowrap", "orientation": "horizontal", "justifyContent": "left" | "center" | "right", "verticalAlignment": "top" }, }, [ [ ANY_BLOCK ], ], ],
- Row: Vertical layout (DO NOT Change the attributes here): [ "core/group", { "aling": wide, "layout": { "type":"flex", "orientation": "vertical", }, }, [ [ ANY_BLOCK ], ], ],

## Quote blocks: You can use these blocks to compose a quote. It accepts ANY_BLOCK block as a child.
- Quote: [ "core/quote", { "citation": WHO_CITATION, }, [ [ ANY_BLOCK ], ], ],

## List blocks: You can use these blocks to compose a list. It accepts "core/list-item" block as a child.
- List: [ "core/list", { "ordered": ORDERED }, [ [ "core/list-item", { "content": CONTENT }, ], ], ],
- List Item: [ "core/list-item", { "content": CONTENT, }, ],

## Cover blocks: Nice to create a simple composition with a background image. It accepts ANY_BLOCK block as a child.
- Cover: [ "core/cover", { "url": IMAGE_URL, "overlayColor": "base", "dimRatio": 80, }, [ [ ANY_BLOCK ], ], ],

## Form block: Use it to create a form. It accepts any "jetpack/field-<ANY>" and ANY_BLOCK block as a child.
- Form: [ "jetpack/contact-form", { "subject": SUBJECT, "to": TO }, [ [ "jetpack/field-<ANY>", ], ], ],
- Text field: [ "jetpack/field-text", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- Name field: [ "jetpack/field-name", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- Email field: [ "jetpack/field-email", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- URL field: [ "jetpack/field-url", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- Date field: [ "jetpack/field-date", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- Telephone field: [ "jetpack/field-telephone", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- Textarea field: [ "jetpack/field-textarea", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- Select/Dropdown field: [ "jetpack/field-select", { "label": LABEL, "required": REQUIRED, "requiredText":  REQUIRED_TEXT, "options": [ OPTION_1, OPTION_2, OPTION_3, ], }, ],
- Checkbox field*: [ "jetpack/field-checkbox", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- Multiple checkbox field: [ "jetpack/field-checkbox-multiple", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, "options": [ OPTION_1, OPTION_2, OPTION_3, ], }, ],
- Radio button field: [ "jetpack/field-radio", { "label": LABEL, "required": REQUIRED, "requiredText": REQUIRED_TEXT, }, ],
- Consent field: [ "jetpack/field-consent", { "consentType": CONSENT_TYPE, "implicitConsentMessage": IMPLICIT_CONSENT_MESSAGE, "explicitConsentMessage": EXPLICIT_CONSENT_MESSAGE }, ],
- Button field: [ "jetpack/button", { "label": LABEL, "element": ELEMENT, "text": TEXT, "borderRadius": BORDER_RADIUS, "lock": { "remove": true }, }, ],

# When using images, ALWAYS pick from the following list based on the user request:
- Waterfall 01: https://pd.w.org/2022/01/26061d763eca13bb6.11341561.jpg
- Waterfall 02 (grey background): https://pd.w.org/2022/01/84661f60659149cc8.02053291.jpg
- Waterfall 03 (grey background): https://pd.w.org/2022/01/21261f60ba46147b0.97888240.jpg
- Infinite stairs: https://pd.w.org/2023/04/654642d52f20d6367.57324872.jpg
- Tokio Street: https://pd.w.org/2022/03/3866241b433db4ee2.96648572.jpeg
- Outside https://s.w.org/images/core/5.8/outside-{n}.jpg (n: 01, 02, 03)
- Abstract arquitecure: https://s.w.org/images/core/5.8/architecture-{n}.jpg (n: 01, 02, 03, 04)
- Nature photos: https://s.w.org/images/core/5.8/nature-above-{n}.jpg (n: 01, 02)
- Iris flower (oil painting): https://s.w.org/patterns/files/2021/06/Iris-793x1024.jpg
- Cherry Blossom flower (oil painting): https://s.w.org/patterns/files/2021/06/Cherry-Blossom-707x1024.jpg
- Pear fruit (oil painting): https://s.w.org/patterns/files/2021/06/pear-1-1024x1024.png
- Half pear fruit (oil painting): https://s.w.org/patterns/files/2021/06/pear-half-1024x1024.png
- Pheronema giganteum (old illustration): http://localhost/wp-content/uploads/2023/08/image-1.jpeg
- Sarcopodium lyoni (old illustration): http://localhost/wp-content/uploads/2023/08/image.jpeg
- Snowed mountain 01: http://localhost/wp-content/uploads/2023/08/image-2.jpeg
- Snowed mountain 02: http://localhost/wp-content/uploads/2023/08/image-3.jpeg
- Portrait: https://s.w.org/images/core/5.8/portrait.jpg

- DO NOT add any addtional feedback to the "user", just generate the requested block structure.
- Only Return the array of blocks: [[BLOCK_NAME, BLOCK_ATTRIBUTES],[BLOCK_NAME, BLOCK_ATTRIBUTES, [BLOCK_NAME, BLOCK_ATTRIBUTES],BLOCK_NAME, BLOCK_ATTRIBUTES, [BLOCK_NAME, BLOCK_ATTRIBUTES, [BLOCK_NAME, BLOCK_ATTRIBUTES]],],],

IMPORTANT: You are an advanced polyglot ghostwriter with deep expertise in a multitude of subjects. Help me to address the following request:
\`\`\`
${ request }
\`\`\`
`,
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

		case PROMPT_TYPE_GUTENBERG_SYNTAX_PROMPT:
			// Does not use the default system prompt.
			return [ ...prevMessages, ...getGuenbergSyntaxCompositionPrompt( options ) ];

		case PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT:
			// Does not use the default system prompt.
			return [ ...prevMessages, ...getJetpackFormCustomPrompt( options ) ];

		default:
			throw new Error( `Unknown prompt type: ${ type }` );
	}
}
