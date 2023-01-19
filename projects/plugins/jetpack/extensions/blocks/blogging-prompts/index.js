import { __ } from '@wordpress/i18n';
import edit from './edit';
import save from './save';

export const name = 'blogging-prompts';
export const title = __( 'Writing Prompt', 'jetpack' );

export const settings = {
	title,
	icon: 'megaphone',
	category: 'text',
	keywords: [],
	description: __( 'Answer a new and inspiring writing prompt each day.', 'jetpack' ),
	attributes: {
		answerCount: {
			type: 'number',
		},
		gravatars: {
			type: 'array',
		},
		prompt: {
			type: 'text',
		},
		prompt_id: {
			type: 'number',
		},
		showAnswers: {
			type: 'boolean',
		},
		showLabel: {
			type: 'boolean',
		},
	},
	// supports: {},
	edit,
	save,
	// example: {
	// 	attributes: {},
	// },
};
