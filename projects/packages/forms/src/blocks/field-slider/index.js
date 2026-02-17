import { __ } from '@wordpress/i18n';
import SliderIcon from '../input-range/icon.jsx';
import defaultSettings from '../shared/settings/index.js';
import edit from './edit.js';
import save from './save.js';

export const name = 'field-slider';

export const form_editor = {
	category: 'advanced',
};

export const settings = {
	...defaultSettings,
	title: __( 'Slider field', 'jetpack-forms' ),
	description: __( 'Collect a value from site visitors using a slider field.', 'jetpack-forms' ),
	icon: {
		src: <SliderIcon />,
	},
	attributes: {
		...defaultSettings.attributes,
		min: {
			type: 'number',
			default: 0,
		},
		max: {
			type: 'number',
			default: 100,
		},
		default: {
			type: 'number',
			default: 0,
		},
		step: {
			type: 'number',
			default: 1,
		},
		minLabel: {
			type: 'string',
			default: '',
		},
		maxLabel: {
			type: 'string',
			default: '',
		},
	},
	edit,
	save,
	supports: {
		...defaultSettings.supports,
		interactivity: true,
	},
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-slider-min': 'min',
		'jetpack/field-slider-max': 'max',
		'jetpack/field-slider-default': 'default',
		'jetpack/field-slider-step': 'step',
		'jetpack/field-slider-minLabel': 'minLabel',
		'jetpack/field-slider-maxLabel': 'maxLabel',
	},
	example: {
		attributes: {
			min: 0,
			max: 100,
			default: 0,
			step: 1,
		},
		innerBlocks: [
			{
				name: 'jetpack/label',
				attributes: {
					label: __( 'Slider', 'jetpack-forms' ),
				},
			},
			{
				name: 'jetpack/input-range',
				attributes: {},
			},
		],
	},
};

export default {
	name,
	settings,
	form_editor,
};
