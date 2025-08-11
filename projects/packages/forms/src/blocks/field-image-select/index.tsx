/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { image as icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { getImageChoiceLabel } from '../form-image-select-choice/label';
import defaultSettings from '../shared/settings';
import edit from './edit';
import save from './save';

const name = 'field-image-select';

const settings = {
	...defaultSettings,
	title: __( 'Image select field', 'jetpack-forms' ),
	keywords: [
		__( 'Image', 'jetpack-forms' ),
		__( 'Image select', 'jetpack-forms' ),
		__( 'Image select field', 'jetpack-forms' ),
	],
	description: __(
		'Add a field that allows visitors to select images from a list of options.',
		'jetpack-forms'
	),
	icon,
	edit,
	attributes: {
		...defaultSettings.attributes,
		multiple: {
			type: 'boolean',
			default: false,
		},
	},
	save,
	example: {
		attributes: {
			multiple: false,
		},
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Image select', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/form-image-select-choices',
				attributes: {
					multiple: false,
				},
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
		],
	},
};

export default {
	name,
	settings,
};
