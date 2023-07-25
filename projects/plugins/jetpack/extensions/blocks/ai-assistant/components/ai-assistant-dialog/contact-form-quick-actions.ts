/*
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { postExcerpt } from '@wordpress/icons';
import { PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM } from '../../lib/prompt';

// Quick edits option: "Correct spelling and grammar"
const CONTACT_FORM_KEY_CORRECT_SPELLING = 'correct-spelling' as const;

// Quick edits option: "Simplify"
const CONTACT_FORM_KEY_SIMPLIFY = 'simplify' as const;

// Quick edits option: "Summarize"
const CONTACT_FORM_KEY_SUMMARIZE = 'summarize' as const;

// Quick edits option: "Summarize based on title"
const CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE = 'summarize-based-on-title' as const;

// Quick edits option: "Make longer"
const CONTACT_FORM_KEY_MAKE_LONGER = 'make-longer' as const;

// Quick edits option: "Make shorter"
const CONTACT_FORM_KEY_MAKE_SHORTER = 'make-shorter' as const;

// Ask AI Assistant option
export const KEY_ASK_AI_ASSISTANT = 'ask-ai-assistant' as const;

const CONTACT_FORM_KEY_LIST = [
	CONTACT_FORM_KEY_CORRECT_SPELLING,
	CONTACT_FORM_KEY_SIMPLIFY,
	CONTACT_FORM_KEY_SUMMARIZE,
	CONTACT_FORM_KEY_MAKE_LONGER,
	CONTACT_FORM_KEY_MAKE_SHORTER,
	CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE,
] as const;

type AiAssistantKeyProp = ( typeof CONTACT_FORM_KEY_LIST )[ number ] | typeof KEY_ASK_AI_ASSISTANT;

export const actionsList = [
	{
		name: __( 'Create a contact form', 'jetpack' ),
		key: CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE,
		promptType: PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM,
		icon: postExcerpt,
	},
	{
		name: __( 'Create a newsletter signup form', 'jetpack' ),
		key: CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE,
		promptType: PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM,
		icon: postExcerpt,
	},
	{
		name: __( 'Create a RSVP form', 'jetpack' ),
		key: CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE,
		promptType: PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM,
		icon: postExcerpt,
	},
	{
		name: __( 'Create a registration form', 'jetpack' ),
		key: CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE,
		promptType: PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM,
		icon: postExcerpt,
	},

	{
		name: __( 'Create a appointment form', 'jetpack' ),
		key: CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE,
		promptType: PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM,
		icon: postExcerpt,
	},

	{
		name: __( 'Create a feedback form', 'jetpack' ),
		key: CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE,
		promptType: PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM,
		icon: postExcerpt,
	},

	{
		name: __( 'Create a Salesform Lead form', 'jetpack' ),
		key: CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE,
		promptType: PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM,
		icon: postExcerpt,
	},
];
