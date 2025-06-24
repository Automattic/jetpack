import { __ } from '@wordpress/i18n';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import StepContainerIcon from './icon';
import save from './save';

export const name = 'form-step-container';

export const settings = {
	apiVersion: 3,
	title: __( 'Steps', 'jetpack-forms' ),
	allowedBlocks: [ 'jetpack/form-step' ],
	ancestor: [ 'jetpack/contact-form' ],
	category: 'contact-form',
	description: __( 'A container that organizes multiple form steps.', 'jetpack-forms' ),
	icon: {
		foreground: getIconColor(),
		src: StepContainerIcon,
	},
	supports: {
		html: false,
		reusable: false,
		color: {
			gradients: true,
			link: true,
			background: true,
		},
		spacing: {
			padding: true,
			margin: true,
		},
		dimensions: {
			minHeight: true,
		},
		shadow: true,
		__experimentalBorder: {
			color: true,
			radius: true,
			style: true,
			width: true,
		},
	},
	attributes: {},
	template: [ [ 'jetpack/form-step', {} ] ],
	edit: edit,
	save: save,
	example: {},
};

export default {
	name,
	settings,
};
