/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { group as icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import edit from './edit';
import { getImageChoiceLabel } from './label';
import save from './save';

const name = 'form-image-select-choice';

const settings = {
	apiVersion: 3,
	title: __( 'Image choice field', 'jetpack-forms' ),
	description: __( 'An image option for a image select field.', 'jetpack-forms' ),
	icon,
	parent: [ 'jetpack/form-image-select-choices' ],
	edit,
	attributes: {},
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: getImageChoiceLabel( 1 ),
				},
			},
			{
				name: 'core/image',
				attributes: {
					url: 'https://s.w.org/images/core/5.3/Glacial_lakes%2C_Bhutan.jpg',
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
