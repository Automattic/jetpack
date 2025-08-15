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

const name = 'input-image-option';

const settings = {
	apiVersion: 3,
	title: __( 'Image option', 'jetpack-forms' ),
	description: __( 'A single image option for an image select field.', 'jetpack-forms' ),
	icon,
	parent: [ 'jetpack/fieldset-image-options' ],
	usesContext: [
		'jetpack/field-image-select-is-supersized',
		'jetpack/field-image-select-show-labels',
		'jetpack/field-share-attributes',
	],
	providesContext: {
		allowResize: 'allowResize',
		imageCrop: 'imageCrop',
		fixedHeight: 'fixedHeight',
	},
	supports: {
		color: {
			background: true,
			text: true,
			gradients: false,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
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
	edit,
	attributes: {
		style: {
			type: 'object',
			default: {
				border: {
					width: '1px',
					color: '#dee2e6',
					radius: '4px',
					style: 'solid',
				},
				spacing: {
					margin: '0',
					padding: '8px',
				},
				color: {
					background: '#f8f9fa',
					text: '#212529',
				},
			},
		},
		fontSize: {
			type: 'string',
			default: 'medium',
		},
		allowResize: {
			type: 'boolean',
			default: false,
		},
		imageCrop: {
			type: 'boolean',
			default: true,
		},
		fixedHeight: {
			type: 'boolean',
			default: true,
		},
		label: {
			type: 'string',
			default: '',
		},
	},
	save,
};

export default {
	name,
	settings,
};
