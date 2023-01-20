import { __ } from '@wordpress/i18n';
import edit from './edit';
import icon from './icon';
import save from './save';

export const name = 'blogging-prompts';
export const title = __( 'Writing Prompt', 'jetpack' );

export const settings = {
	title,
	icon,
	category: 'text',
	keywords: [],
	description: __( 'Answer a new and inspiring writing prompt each day.', 'jetpack' ),
	attributes: {
		answerCount: {
			type: 'number',
		},
		gravatars: {
			type: 'array',
			source: 'query',
			selector: '.jetpack-blogging-prompts__answers-gravatar',
			query: {
				url: {
					type: 'string',
					source: 'attribute',
					attribute: 'src',
				},
			},
		},
		prompt: {
			type: 'text',
			source: 'html',
			selector: '.jetpack-blogging-prompts__prompt',
		},
		prompt_id: {
			type: 'number',
		},
		showResponses: {
			type: 'boolean',
			default: true,
		},
		showLabel: {
			type: 'boolean',
			default: true,
		},
	},
	supports: {
		color: {
			background: true,
			gradients: true,
			link: true,
			text: true,
		},
	},
	edit,
	save,
	// example: {
	// 	attributes: {},
	// },
};
