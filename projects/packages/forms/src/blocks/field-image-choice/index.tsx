/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { group as icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import defaultSettings from '../shared/settings';
import edit from './edit';
import save from './save';

const name = 'field-image-choice';

const settings = {
	...defaultSettings,
	title: __( 'Image choice field', 'jetpack-forms' ),
	keywords: [
		__( 'Image', 'jetpack-forms' ),
		__( 'Image choice', 'jetpack-forms' ),
		__( 'Image choice field', 'jetpack-forms' ),
	],
	description: __( 'An image option for a image select field.', 'jetpack-forms' ),
	icon,
	parent: [ 'jetpack/field-image-choices' ],
	edit,
	attributes: {
		...defaultSettings.attributes,
	},
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
					url: 'https://placehold.co/200x200',
				},
			},
		],
	},
};

export default {
	name,
	settings,
};
