import { __ } from '@wordpress/i18n';

const name = 'field-option-radio';
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
		// FORMS-694: choice/option blocks flatten through the field shortcode
		// like inputs — visibility is inert; disable the control.
		visibility: false,
		html: false,
		inserter: false,
		reusable: false,
		splitting: true,
	},
	title: __( 'Single Choice Option', 'jetpack-forms' ),
	edit: () => null,
	save: () => null,
};

export default {
	name,
	settings,
};
