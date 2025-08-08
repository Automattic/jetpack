/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { group as icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import edit from './edit';
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
};

export default {
	name,
	settings,
};
