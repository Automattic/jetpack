import { __ } from '@wordpress/i18n';
import { next } from '@wordpress/icons';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

export const name = 'form-step-navigation';

const FieldDefaults = {
	category: 'contact-form',
	parent: [ 'jetpack/contact-form' ],
	attributes: {
		label: {
			type: 'string',
		},
		required: {
			type: 'boolean',
		},
		width: {
			type: 'number',
			default: 100,
		},
	},
	supports: {
		html: false,
		reusable: false,
	},
	save: () => null,
};

export const settings = {
	...FieldDefaults,
	ancestor: [ 'jetpack/contact-form', 'jetpack/form-step' ],
	supports: {
		...FieldDefaults.supports,
		layout: {
			allowSwitching: false,
			allowInheriting: false,
			default: {
				type: 'flex',
			},
		},
	},
	title: __( 'Step navigation', 'jetpack-forms' ),
	description: __( 'Responsible for the navigation between steps.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: next,
	},
	edit: edit,
	save: save,
	transforms: {},
	example: {},
};

export default {
	name,
	settings,
};
