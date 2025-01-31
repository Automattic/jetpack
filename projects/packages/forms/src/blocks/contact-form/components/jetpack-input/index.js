import { __ } from '@wordpress/i18n';
import edit from './edit';
import save from './save';

const name = 'field-input';
const settings = {
	apiVersion: 3,
	title: __( 'Field Input', 'jetpack-forms' ),
	description: __( 'An input field for forms', 'jetpack-forms' ),
	category: 'contact-form',
	parent: [
		'jetpack/field-text',
		'jetpack/field-name',
		'jetpack/field-email',
		'jetpack/field-url',
		'jetpack/field-telephone',
		// 'jetpack/date',
		// 'jetpack/textarea',
		// 'jetpack/checkbox-multiple',
		// 'jetpack/radio',
		// 'jetpack/select',
	],
	supports: {
		reusable: false,
		html: false,
		color: {
			text: true,
			background: true,
			gradient: true,
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
			width: true,
			style: true,
			radius: true,
			__experimentalDefaultControls: {
				color: true,
				width: true,
				style: true,
				radius: true,
			},
		},
		// More to come...
	},
	attributes: {
		placeholder: {
			type: 'string',
			default: '',
		},
	},
	edit,
	save,
	selectors: {
		color: '.wp-block-jetpack-field-input, .wp-block-jetpack-field-input::placeholder',
	},
};

export default {
	name,
	settings,
};
