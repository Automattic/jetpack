import { __ } from '@wordpress/i18n';
import edit from './edit';
import save from './save';

const name = 'option';
const settings = {
	apiVersion: 3,
	title: __( 'Option', 'jetpack-forms' ),
	description: __( 'An option for a form choice field', 'jetpack-forms' ),
	category: 'contact-form',
	parent: [ 'jetpack/field-checkbox', 'jetpack/field-consent', 'jetpack/options' ],
	supports: {
		reusable: false,
		html: false,
		splitting: true,
		color: {
			text: true,
			background: false,
			gradient: false,
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
		defaultLabel: {
			type: 'string',
			default: '',
		},
		label: {
			type: 'string',
			default: '',
		},
		requiredText: {
			type: 'string',
			default: '',
		},
		hideInput: {
			type: 'boolean',
			default: false,
		},
		isStandalone: {
			type: 'boolean',
			default: false,
		},
	},
	usesContext: [
		'jetpack/field-defaultValue',
		'jetpack/field-options-type',
		'jetpack/field-required',
		'jetpack/field-share-attributes',
	],
	edit,
	save,
};

export default {
	name,
	settings,
};
