import { __ } from '@wordpress/i18n';

const name = 'field-option-checkbox';
const settings = {
	apiVersion: 3,
	category: 'contact-form',
	attributes: {
		label: {
			type: 'string',
			role: 'content',
		},
		fieldType: {
			enum: [ 'checkbox', 'radio' ],
			default: 'checkbox',
		},
	},
	supports: {
		html: false,
		inserter: false,
		reusable: false,
		splitting: true,
	},
	title: __( 'Multiple Choice Option', 'jetpack-forms' ),
	edit: () => null,
	save: () => null,
};

export default {
	name,
	settings,
};
