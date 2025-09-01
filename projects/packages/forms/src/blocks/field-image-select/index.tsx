/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getImageOptionLabel } from '../input-image-option/label';
import defaultSettings from '../shared/settings';
import edit from './edit';
import icon from './icon';
import save from './save';

const name = 'field-image-select';

const settings = {
	...defaultSettings,
	title: __( 'Image Select Field', 'jetpack-forms' ),
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
		showLabels: {
			type: 'boolean',
			default: true,
		},
		isSupersized: {
			type: 'boolean',
			default: false,
		},
		isMultiple: {
			type: 'boolean',
			default: false,
		},
		randomizeOptions: {
			type: 'boolean',
			default: false,
		},
		showOtherOption: {
			type: 'boolean',
			default: false,
		},
	},
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-image-select-show-labels': 'showLabels',
		'jetpack/field-image-select-is-supersized': 'isSupersized',
		'jetpack/field-image-select-is-multiple': 'isMultiple',
		'jetpack/field-image-select-randomize-options': 'randomizeOptions',
		'jetpack/field-image-select-show-other-option': 'showOtherOption',
	},
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Image select', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/fieldset-image-options',
				innerBlocks: [
					{
						name: 'jetpack/input-image-option',
						attributes: {
							label: getImageOptionLabel( 1 ),
						},
						innerBlocks: [
							{
								name: 'core/image',
								attributes: {
									url: 'https://s.w.org/images/core/5.3/Glacial_lakes%2C_Bhutan.jpg',
									scale: 'cover',
									aspectRatio: '1',
								},
							},
						],
					},
					{
						name: 'jetpack/input-image-option',
						attributes: {
							label: getImageOptionLabel( 2 ),
						},
						innerBlocks: [
							{
								name: 'core/image',
								attributes: {
									url: 'https://s.w.org/images/core/5.3/Sediment_off_the_Yucatan_Peninsula.jpg',
									scale: 'cover',
									aspectRatio: '1',
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
