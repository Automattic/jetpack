/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

// Maximum number of characters we send from the content
export const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 1024;

// Suffix to add to the prompt
export const PROMPT_INTERNAL_OPTIONS =
	'Please always output the generated content in markdown format, do not include a top level heading by default and only output generated content ready for publishing';
export const PROMPT_SUFFIX = `. ${ PROMPT_INTERNAL_OPTIONS }.`;
export const PROMPT_MID_CONTENT = `, and ${ PROMPT_INTERNAL_OPTIONS.toLowerCase() }`;

/*
 * Builds a prompt template based on tone, rules and content
 *
 * @param {object} options - The prompt options.
 * @param {string} options.tone    - The expected tone to the prompt, e.g. "You are...".
 * @param {array} options.rules    - An array of rules to be followed.
 * @param {string} options.request - The prompt request.
 * @param {string} options.content - The content to be modified.
 *
 * @return {string} The prompt.
 */
export const buildPromptTemplate = ( {
	tone = 'You are an AI assistant block, a part of a product called Jetpack made by the company called Automattic',
	rules = [],
	request = null,
	content = null,
} ) => {
	if ( ! request && ! content ) {
		throw new Error( 'You must provide either a request or content' );
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

	const requestText = ! request
		? ''
		: `\nRequest:
${ request }`;

	const contentText = ! content
		? ''
		: `\nContent:
${ content }`;

	return `${ tone }.
${ job }. Do this by following rules set in "Rules".

Rules:
- Output the generated content in markdown format.
- Do not include a top level heading by default.
- Only output generated content ready for publishing.${ rules.length ? '\n' : '' }${ rules
		.map( rule => `- ${ rule }.` )
		.join( '\n' ) }
${ requestText }${ requestText && contentText ? `\n${ contentText }` : contentText }`;
};

/*
 * Creates the prompt that will eventually be sent to OpenAI.
 * It uses the current post title, content (before the actual AI block)
 * - or a slice of it if too long, and tags + categories names
 * to create a prompt.
 *
 * @param {string} postTitle       - The current post title.
 * @param {string} contentBefore   - The content before the current block.
 * @param {string} content         - The whole content.
 * @param {string} userPrompt      - The user prompt.
 * @param {string} type            - The type of prompt to create.
 * @param {string} categoriesNames - The categories names.
 * @param {string} tagsNames       - The tags names.
 *
 * @return {string} The prompt.
 */
export const createPrompt = (
	postTitle = '',
	contentBefore = '',
	content = '',
	userPrompt = '',
	type = '',
	// eslint-disable-next-line no-unused-vars
	categoriesNames = '',
	// eslint-disable-next-line no-unused-vars
	tagsNames = ''
) => {
	if (
		! postTitle?.length &&
		! contentBefore?.length &&
		! userPrompt?.length &&
		! content?.length
	) {
		return '';
	}

	// When type is not defined,
	// let's set it based on the title, content, and userPrompt.
	if ( ! type ) {
		if ( userPrompt?.length ) {
			type = 'userPrompt';
		} else if ( postTitle?.length ) {
			type = 'titleSummary';
		}
	}

	if ( type === 'userPrompt' ) {
		return userPrompt + PROMPT_SUFFIX;
	}

	// Sanitize content and trim it to the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters.
	contentBefore = contentBefore?.length ? contentBefore.replace( /<br\s*\/?>/gi, '\n' ) : '';
	contentBefore = contentBefore.slice( -MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT );

	if ( type === 'titleSummary' ) {
		if ( ! postTitle?.length ) {
			return '';
		}

		const continueFromHere = contentBefore?.length
			? sprintf(
					/** translators: This will be the end of a prompt that will be sent to OpenAI with the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content.*/
					__( '. Additional context:\n\n … %s', 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
					contentBefore
			  )
			: '';

		const titlePrompt = sprintf(
			/** translators: This will be the beginning of a prompt that will be sent to OpenAI based on the post title. */
			__( "Please help me write a short piece of a blog post titled '%1$s'%2$s", 'jetpack' ),
			postTitle,
			continueFromHere
		);
		return titlePrompt + PROMPT_SUFFIX;
	}

	if ( type === 'summarize' ) {
		content = content?.length ? content.replace( /<br\s*\/?>/gi, '\n' ) : '';
		content = content.slice( -MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT );

		const expandPrompt = sprintf(
			/** translators: This will be the end of a prompt that will be sent to OpenAI with the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content.*/
			__( 'Summarize this:\n\n … %s', 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
			content
		);

		return expandPrompt + PROMPT_SUFFIX;
	}

	if ( type === 'continue' ) {
		const expandPrompt = sprintf(
			/** translators: This will be the end of a prompt that will be sent to OpenAI with the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content.*/
			__( ' Please continue from here:\n\n … %s', 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
			contentBefore
		);

		return expandPrompt + PROMPT_SUFFIX;
	}

	if ( type === 'simplify' ) {
		if ( ! contentBefore?.length ) {
			return '';
		}

		const simplifyPrompt = sprintf(
			'The selected text should be simplified to use words and phrases that are easier to understand for non-technical people. Output in the same language as the user%1$s. Selected text:\n\n%2$s',
			PROMPT_SUFFIX,
			contentBefore
		);

		return simplifyPrompt;
	}

	if ( type === 'correctSpelling' ) {
		if ( ! contentBefore?.length ) {
			return '';
		}

		const expandPrompt = sprintf(
			'Please correct any spelling and grammar mistakes from the following text%1$s:\n\n%2$s\n\n',
			PROMPT_MID_CONTENT,
			contentBefore
		);
		return expandPrompt;
	}

	if ( type === 'generateTitle' ) {
		if ( ! content.length ) {
			return '';
		}

		return buildPromptTemplate( {
			request: 'Generate a title for this blog post',
			rules: [ 'Only output the raw title, without any prefix or quotes' ],
			content,
		} );
	}

	// TODO: add some error handling if user supplied prompts or existing content is too short.

	// We prevent a prompt if everything is empty.
	// if ( ! postTitle && ! shorter_content && ! categoriesNames && ! tagsNames && ! userPrompt ) {
	// 	return false;
	// }

	// TODO: decide if we want to use categories and tags in the prompt now that user is supplying their own prompt default.
	// The following was copied over from the AI Paragraph block.

	// if ( categoriesNames ) {
	// 	/** translators: This will be the follow up of a prompt that will be sent to OpenAI based on comma-seperated category names. */
	// 	prompt += sprintf( __( ", published in categories '%1$s'", 'jetpack' ), categoriesNames );
	// }

	// if ( tagsNames ) {
	// 	/** translators: This will be the follow up of a prompt that will be sent to OpenAI based on comma-seperated category names. */
	// 	prompt += sprintf( __( " and tagged '%1$s'", 'jetpack' ), tagsNames );
	// }

	// return prompt.trim();
};
