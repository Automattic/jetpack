import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings';
import edit from './edit';
import SliderIcon from './icon';
import save from './save';

const name = 'input-range';
const settings = {
	...defaultSettings,
	title: __( 'Range input', 'jetpack-forms' ),
	description: __( 'Collect a value from site visitors using a slider.', 'jetpack-forms' ),
	icon: {
		src: <SliderIcon />,
	},
	parent: [ 'jetpack/field-slider' ],
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
			default: 50,
		},
	},
	edit,
	save,
	example: {
		attributes: {
			min: 0,
			max: 100,
			value: 50,
		},
	},
};

export default {
	name,
	settings,
};
