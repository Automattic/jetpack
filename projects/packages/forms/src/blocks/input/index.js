import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../contact-form/util/render-material-icon';
import edit from './edit';
import save from './save';

const name = 'input';
const settings = {
	apiVersion: 3,
	title: __( 'Input', 'jetpack-forms' ),
	description: __( 'An input for a form field', 'jetpack-forms' ),
	category: 'contact-form',
	icon: {
		src: renderMaterialIcon(
			<Path d="M19 6.5C19.5304 6.5 20.039 6.71086 20.4141 7.08594C20.7891 7.46101 21 7.96957 21 8.5V15C21 15.5304 20.7891 16.039 20.4141 16.4141C20.039 16.7891 19.5304 17 19 17H5C4.46957 17 3.96101 16.7891 3.58594 16.4141C3.21086 16.039 3 15.5304 3 15V8.5C3 7.96957 3.21086 7.46101 3.58594 7.08594C3.96101 6.71086 4.46957 6.5 5 6.5H19ZM5 8C4.86739 8 4.74025 8.05272 4.64648 8.14648C4.55272 8.24025 4.5 8.36739 4.5 8.5V15C4.5 15.1326 4.55272 15.2597 4.64648 15.3535C4.74025 15.4473 4.86739 15.5 5 15.5H19C19.1326 15.5 19.2597 15.4473 19.3535 15.3535C19.4473 15.2597 19.5 15.1326 19.5 15V8.5C19.5 8.36739 19.4473 8.24025 19.3535 8.14648C19.2597 8.05272 19.1326 8 19 8H5Z" />
		),
	},
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
			gradients: false,
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
