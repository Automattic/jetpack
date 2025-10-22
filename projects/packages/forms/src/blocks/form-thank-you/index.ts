/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import save from './save';

export const name = 'form-thank-you';

export const settings = {
	apiVersion: 3,
	title: __( 'Thank You Message', 'jetpack-forms' ),
	category: 'contact-form',
	description: __( 'Customize the message shown after form submission.', 'jetpack-forms' ),
	icon,
	parent: [ 'jetpack/contact-form' ],
	supports: {
		html: false,
		reusable: false,
		inserter: false, // Auto-created only, not manually insertable
		align: true,
		color: {
			background: true,
			text: false,
			__experimentalDefaultControls: {
				background: true,
			},
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
		spacing: {
			margin: true,
			padding: true,
			__experimentalDefaultControls: {
				margin: true,
				padding: true,
			},
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
	},
	edit: edit,
	save: save,
	example: {},
};

export default {
	name,
	settings,
};
