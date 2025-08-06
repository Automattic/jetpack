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

const name = 'field-image-choices';

const settings = {
	...defaultSettings,
	title: __( 'Image choices field', 'jetpack-forms' ),
	keywords: [
		__( 'Image', 'jetpack-forms' ),
		__( 'Image choices', 'jetpack-forms' ),
		__( 'Image choices field', 'jetpack-forms' ),
	],
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
				name: 'jetpack/field-image-choice',
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
			{
				name: 'jetpack/field-image-choice',
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
							url: 'https://placehold.co/200x200',
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
