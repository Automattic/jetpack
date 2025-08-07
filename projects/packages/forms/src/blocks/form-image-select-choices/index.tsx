/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { gallery as icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import defaultSettings from '../shared/settings';
import edit from './edit';
import save from './save';

const name = 'form-image-select-choices';

const settings = {
	...defaultSettings,
	title: __( 'Image choices field', 'jetpack-forms' ),
	description: __( 'A list of image choices for a image select field.', 'jetpack-forms' ),
	icon,
	parent: [ 'jetpack/field-image-select' ],
	edit,
	attributes: {
		...defaultSettings.attributes,
	},
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/form-image-select-choice',
				innerBlocks: [
					{
						name: 'jetpack/label',
						attributes: {
							label: sprintf(
								// translators: %d is the number of the image choice field.
								__( 'Image choice %d', 'jetpack-forms' ),
								1
							),
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
							label: sprintf(
								// translators: %d is the number of the image choice field.
								__( 'Image choice %d', 'jetpack-forms' ),
								2
							),
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
