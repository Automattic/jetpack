import { __ } from '@wordpress/i18n';
import { next } from '@wordpress/icons';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

export const name = 'form-step-navigation';

export const settings = {
	apiVersion: 3,
	category: 'contact-form',
	ancestor: [ 'jetpack/contact-form' ],
	supports: {
		html: false,
		reusable: false,
		spacing: {
			margin: true,
		},
		layout: {
			allowSwitching: false,
			allowInheriting: false,
			default: {
				type: 'flex',
				justifyContent: 'right',
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
