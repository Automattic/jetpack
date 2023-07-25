/*
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { postExcerpt } from '@wordpress/icons';
import { PROMPT_TYPE_JETPACK_CONTACT_FORM_CONTACT_FORM } from '../../lib/prompt';

// Quick edits option: "Summarize based on title"
const CONTACT_FORM_KEY_SUMMARIZE_BASED_ON_TITLE = 'summarize-based-on-title' as const;

// Ask AI Assistant option
export const KEY_ASK_AI_ASSISTANT = 'ask-ai-assistant' as const;

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
