/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { gallery as icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { getImageChoiceLabel } from '../form-image-select-choice/label';
import edit from './edit';
import save from './save';

const name = 'form-image-select-choices';

const settings = {
	apiVersion: 3,
	title: __( 'Image choices', 'jetpack-forms' ),
	description: __( 'A list of image choices for an image select field.', 'jetpack-forms' ),
	icon,
	parent: [ 'jetpack/field-image-select' ],
	usesContext: [ 'jetpack/field-is-supersized' ],
	edit,
	attributes: {},
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/form-image-select-choice',
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
			{
				name: 'jetpack/form-image-select-choice',
				innerBlocks: [
					{
						name: 'jetpack/label',
						attributes: {
							label: getImageChoiceLabel( 2 ),
						},
					},
					{
						name: 'core/image',
						attributes: {
							url: 'https://s.w.org/images/core/5.3/Sediment_off_the_Yucatan_Peninsula.jpg',
						},
					},
				],
			},
		],
	},
};

export default {
	name,
	settings,
};
