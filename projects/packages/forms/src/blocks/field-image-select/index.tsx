/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { image as icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
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
				name: 'jetpack/field-image-choices',
				attributes: {
					multiple: false,
				},
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
		],
	},
};

export default {
	name,
	settings,
};
