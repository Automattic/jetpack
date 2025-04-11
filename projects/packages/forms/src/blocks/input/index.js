import { __ } from '@wordpress/i18n';
import edit from './edit';
import save from './save';

const name = 'input';
const settings = {
	apiVersion: 3,
	title: __( 'Input', 'jetpack-forms' ),
	description: __( 'An input for a form field', 'jetpack-forms' ),
	category: 'contact-form',
	parent: [
		'jetpack/field-date',
		'jetpack/field-email',
		'jetpack/field-name',
		'jetpack/field-number',
		'jetpack/field-select',
		'jetpack/field-telephone',
		'jetpack/field-text',
		'jetpack/field-textarea',
	],
	usesContext: [ 'jetpack/field-share-attributes' ],
	supports: {
		reusable: false,
		html: false,
		color: {
			text: true,
			background: true,
			gradient: true,
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
	},
	attributes: {
		placeholder: {
			type: 'string',
			default: '',
		},
		type: { type: 'string' },
		min: { type: 'number' },
		max: { type: 'number' },
	},
	edit,
	save,
};

export default {
	name,
	settings,
};
