import { __ } from '@wordpress/i18n';
import edit from './edit';
import save from './save';

const name = 'field-label';
const settings = {
	apiVersion: 3,
	title: __( 'Field Label', 'jetpack-forms' ),
	description: __( 'A label for a form field', 'jetpack-forms' ),
	category: 'contact-form',
	parent: [
		'jetpack/field-text-v2',
		'jetpack/field-name-v2',
		'jetpack/field-email-v2',
		'jetpack/field-url-v2',
		'jetpack/field-telephone-v2',
		// 'jetpack/date',
		// 'jetpack/textarea',
		// 'jetpack/checkbox-multiple',
		// 'jetpack/radio',
		// 'jetpack/select',
	],
	supports: {
		reusable: false,
		html: false,
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
		color: {
			text: true,
			background: false,
			gradient: false,
		},
		// More to come e.g. typography, color, border etc.
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
		required: {
			type: 'boolean',
			default: false,
		},
		requiredText: {
			type: 'string',
			default: '',
		},
	},
	usesContext: [ 'jetpack/field-required' ],
	edit,
	save,
};

export default {
	name,
	settings,
};
