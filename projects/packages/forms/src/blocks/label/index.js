import { __ } from '@wordpress/i18n';
import edit from './edit';
import save from './save';

const name = 'label';
const settings = {
	apiVersion: 3,
	title: __( 'Label', 'jetpack-forms' ),
	description: __( 'A label for a form field', 'jetpack-forms' ),
	category: 'contact-form',
	parent: [
		'jetpack/field-date',
		'jetpack/field-email',
		'jetpack/field-multiple-choice',
		'jetpack/field-name',
		'jetpack/field-number',
		'jetpack/field-select',
		'jetpack/field-single-choice',
		'jetpack/field-telephone',
		'jetpack/field-text',
		'jetpack/field-textarea',
	],
	supports: {
		reusable: false,
		html: false,
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
		label: {
			type: 'string',
			default: '',
		},
		defaultLabel: {
			type: 'string',
			default: '',
		},
		requiredText: {
			type: 'string',
			default: '',
		},
	},
	usesContext: [ 'jetpack/form-className', 'jetpack/field-required', 'jetpack/field-dateFormat' ],
	edit,
	save,
};

export default {
	name,
	settings,
};
