import { __ } from '@wordpress/i18n';
import edit from './edit.js';
import StepIcon from './icon.jsx';
import save from './save.js';

export const name = 'form-step';

export const form_editor = {
	category: 'multistep',
};

export const settings = {
	apiVersion: 3,
	title: __( 'Step', 'jetpack-forms' ),
	category: 'contact-form',
	description: __( 'A single step in a multi-step form.', 'jetpack-forms' ),
	icon: {
		src: StepIcon,
	},
	parent: [ 'jetpack/form-step-container' ],
	supports: {
		html: false,
		reusable: false,
		inserter: true,
		align: true,
		color: {
			gradients: true,
			link: true,
		},
		spacing: {
			padding: true,
			margin: true,
		},
	},
	attributes: {
		align: {
			type: 'string',
		},
		backgroundColor: {
			type: 'string',
		},
		gradient: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		style: {
			type: 'object',
		},
		stepLabel: {
			type: 'string',
		},
	},
	edit: edit,
	save: save,
	example: {},
};

export default {
	name,
	settings,
	form_editor,
};
