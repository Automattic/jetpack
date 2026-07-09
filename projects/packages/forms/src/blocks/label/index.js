import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/primitives';
import edit from './edit.js';
import save from './save.js';

const name = 'label';
const settings = {
	apiVersion: 3,
	title: __( 'Label', 'jetpack-forms' ),
	description: __( 'A label for a form field', 'jetpack-forms' ),
	category: 'contact-form',
	icon: {
		src: (
			<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
				<Path d="M12.9 6H10.9L6.90002 17H8.80002L9.90002 14H14.1L15.2 17H17.1L12.9 6ZM10.4 12.5L11.9 7.6L13.6 12.5H10.4Z" />
			</SVG>
		),
	},
	parent: [
		'jetpack/field-date',
		'jetpack/field-email',
		'jetpack/field-multiple-choice',
		'jetpack/field-name',
		'jetpack/field-number',
		'jetpack/field-rating',
		'jetpack/field-select',
		'jetpack/field-single-choice',
		'jetpack/field-telephone',
		'jetpack/field-text',
		'jetpack/field-textarea',
		'jetpack/field-time',
		'jetpack/field-image-select',
		// Do not include 'jetpack/field-file' since it prevents the label from being duplicated.
	],
	supports: {
		reusable: false,
		html: false,
		color: {
			text: true,
			background: false,
			gradients: false,
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
		// The real support key is `visibility`, not `blockVisibility` (that's the
		// per-instance saved attribute); mirrors the PHP registration. FORMS-694.
		visibility: true,
	},
	attributes: {
		label: {
			type: 'string',
			default: '',
		},
		placeholder: {
			type: 'string',
			default: '',
		},
		requiredText: {
			type: 'string',
			default: '',
		},
		requiredIndicator: {
			type: 'boolean',
			default: true,
		},
		metadata: {
			type: 'object',
			default: {},
		},
	},
	usesContext: [
		'jetpack/form-class-name',
		'jetpack/field-required',
		'jetpack/field-date-format',
		'jetpack/field-share-attributes',
	],
	edit,
	save,
};

export default {
	name,
	settings,
};
