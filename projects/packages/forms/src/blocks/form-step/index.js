import { __ } from '@wordpress/i18n';
import edit from './edit.jsx';
import StepIcon from './icon.jsx';
import save from './save.jsx';

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
		layout: {
			/*
			 * Mirrored in class-contact-form-block.php. `stretch` is what makes a step's
			 * blocks fill it: core maps it onto `align-items`, and any other value shrinks them.
			 */
			default: {
				type: 'flex',
				orientation: 'vertical',
				justifyContent: 'stretch',
				flexWrap: 'nowrap',
			},
			allowSwitching: false,
			allowEditing: true,
			allowOrientation: false,
			allowJustification: true,
			allowVerticalAlignment: false,
			allowWrap: false,
		},
		color: {
			gradients: true,
			link: true,
		},
		background: {
			backgroundImage: true,
			backgroundSize: true,
			__experimentalDefaultControls: {
				backgroundImage: true,
			},
		},
		spacing: {
			padding: true,
			margin: true,
		},
	},
	attributes: {
		// No `align` support; the attribute stays so previously saved values still round-trip.
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
