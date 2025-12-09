import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon.js';
import edit from './edit.js';
import save from './save.js';

const name = 'textarea';
const settings = {
	apiVersion: 3,
	title: __( 'Textarea', 'jetpack-forms' ),
	description: __( 'A textarea for a form field', 'jetpack-forms' ),
	category: 'contact-form',
	icon: {
		src: renderMaterialIcon(
			<Path d="M20 5H4V6.5H20V5ZM5.5 11.5H18.5V18.5H5.5V11.5ZM20 20V10H4V20H20Z" />
		),
	},
	parent: [ 'jetpack/field-textarea' ],
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
		dimensions: {
			minHeight: true,
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
	},
	edit,
	save,
};

export default {
	name,
	settings,
};
