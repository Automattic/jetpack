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
		align: true,
		layout: {
			/*
			 * Mirrored in PHP (class-contact-form-block.php) so both surfaces
			 * generate the same classes and the same scoped container rule.
			 *
			 * `justifyContent: 'stretch'` is what makes a step's blocks fill it.
			 * Core's flex layout maps a vertical container's justification onto
			 * `align-items`, and only `stretch` leaves a child's width alone; the
			 * other values shrink every child to its content. Nothing else in core
			 * stretches flex children, which is why the step needed a `> *` rule
			 * before this.
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
