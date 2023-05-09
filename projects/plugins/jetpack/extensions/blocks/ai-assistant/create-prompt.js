/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

// Maximum number of characters we send from the content
export const MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT = 1024;

// Suffix to add to the prompt
export const PROMPT_SUFFIX = __(
	'. Please always output the generated content in markdown format. Do not include a top level heading by default. Please only output generated content ready for publishing.',
	'jetpack'
);

/*
 * Creates the prompt that will eventually be sent to OpenAI.
 * It uses the current post title, content (before the actual AI block)
 * - or a slice of it if too long, and tags + categories names
 * to create a prompt.
 *
 * @param {string} postTitle       - The current post title.
 * @param {string} contentBefore   - The content before the current block.
 * @param {string} categoriesNames - The categories names.
 * @param {string} tagsNames       - The tags names.
 * @param {string} userPrompt      - The user prompt.
 * @param {string} type            - The type of prompt to create.
 *
 * @return {string} The prompt.
 */
export const createPrompt = (
	postTitle = '',
	contentBefore = '',
	// eslint-disable-next-line no-unused-vars
	categoriesNames = '',
	// eslint-disable-next-line no-unused-vars
	tagsNames = '',
	userPrompt = '',
	type = ''
) => {
	if ( ! postTitle?.length && ! contentBefore?.length && ! userPrompt?.length ) {
		return '';
	}

	// When type is not defined,
	// let's set it based on the title, content,and userPrompt.
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

	const continuePrompt = contentBefore?.length
		? sprintf(
				/** translators: This will be the end of a prompt that will be sent to OpenAI with the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content.*/
				__( 'Please continue from here:\n\n … %s', 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
				contentBefore
		  )
		: '';

	if ( type === 'titleSummary' ) {
		const continueFromHere = continuePrompt.length ? '. ' + continuePrompt : '';
		const titlePrompt = sprintf(
			/** translators: This will be the beginning of a prompt that will be sent to OpenAI based on the post title. */
			__( "Please help me write a short piece of a blog post titled '%1$s'%2$s", 'jetpack' ),
			postTitle,
			continueFromHere
		);
		return titlePrompt + PROMPT_SUFFIX;
	}

	if ( type === 'summarize' ) {
		const expandPrompt = sprintf(
			/** translators: This will be the end of a prompt that will be sent to OpenAI with the last MAXIMUM_NUMBER_OF_CHARACTERS_SENT_FROM_CONTENT characters of content.*/
			__( 'Summarize this:\n\n … %s', 'jetpack' ), // eslint-disable-line @wordpress/i18n-no-collapsible-whitespace
			contentBefore
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
