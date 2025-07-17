import { __ } from '@wordpress/i18n';
import { menu } from '@wordpress/icons';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'dropdown';
const settings = {
	apiVersion: 3,
	title: __( 'Dropdown', 'jetpack-forms' ),
	description: __( 'Options for dropdown fields.', 'jetpack-forms' ),
	parent: [ 'jetpack/field-select' ],
	allowedBlocks: [ 'core/paragraph' ],
	category: 'contact-form',
	icon: {
		foreground: getIconColor(),
		src: menu,
	},
	attributes: {
		style: {
			type: 'object',
			default: {
				dimensions: {
					maxHeight: '350px',
				},
			},
		},
	},
	supports: {
		reusable: false,
		html: false,
		color: {
			gradients: true,
			heading: true,
			button: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		spacing: {
			margin: [ 'top' ],
			padding: true,
		},
		dimensions: {
			minHeight: true,
			maxHeight: true, // Doesn't work :-(
		},
		__experimentalBorder: {
			color: true,
			radius: true,
			style: true,
			width: true,
			__experimentalDefaultControls: {
				color: true,
				radius: true,
				style: true,
				width: true,
			},
		},
	},
	edit,
	save,
};

export default {
	name,
	settings,
};
