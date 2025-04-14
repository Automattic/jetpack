import { __ } from '@wordpress/i18n';
import edit from './edit';
import save from './save';

const name = 'options';
const settings = {
	apiVersion: 3,
	title: __( 'Options', 'jetpack-forms' ),
	description: __( 'A wrapper for a group of options', 'jetpack-forms' ),
	category: 'contact-form',
	parent: [ 'jetpack/field-multiple-choice', 'jetpack/field-single-choice' ],
	attributes: {
		type: {
			type: 'string',
			default: 'checkbox',
		},
	},
	allowedBlocks: [ 'jetpack/field-options' ],
	providesContext: {
		'jetpack/field-options-type': 'type',
	},
	supports: {
		spacing: {
			blockGap: false,
		},
	},
	edit,
	save,
};

export default { name, settings };
