import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../contact-form/util/render-material-icon';
import edit from './edit';
import save from './save';

const name = 'options';
const settings = {
	apiVersion: 3,
	title: __( 'Options', 'jetpack-forms' ),
	description: __( 'A wrapper for a group of options', 'jetpack-forms' ),
	category: 'contact-form',
	icon: {
		src: renderMaterialIcon(
			<Path d="M11.1 15.8H20V14.3H11.1V15.8ZM11.1 7.2V8.7H20V7.2H11.1ZM6 13C4.9 13 4 13.9 4 15C4 16.1 4.9 17 6 17C7.1 17 8 16.1 8 15C8 13.9 7.1 13 6 13ZM6 6C4.9 6 4 6.9 4 8C4 9.1 4.9 10 6 10C7.1 10 8 9.1 8 8C8 6.9 7.1 6 6 6Z" />
		),
	},
	parent: [ 'jetpack/field-multiple-choice', 'jetpack/field-single-choice' ],
	attributes: {
		type: {
			type: 'string',
			default: 'checkbox',
		},
	},
	allowedBlocks: [ 'jetpack/field-options' ],
	providesContext: {
		'jetpack/field-options-type': 'type',
	},
	supports: {
		spacing: {
			blockGap: false,
		},
	},
	edit,
	save,
};

export default { name, settings };
